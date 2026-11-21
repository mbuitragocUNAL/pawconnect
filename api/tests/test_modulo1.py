"""Pruebas del Módulo 1 contra Postgres + pgvector (docker compose up -d db).

Cada prueba nombra la regla del documento de requisitos que protege.
"""

import io
from datetime import date
from unittest import mock

import numpy as np
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from contacto.models import SolicitudContacto
from cuentas.models import CodigoVerificacion, Consentimiento, Usuario
from reportes.models import Candidato, Caso, FotoRecorte, Reporte
from reportes.servicios import buscar_candidatos, distancia_km

pytestmark = pytest.mark.django_db

SUBA = (4.7410, -74.0840)


@pytest.fixture(autouse=True)
def media_tmp(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    settings.STORAGES = {**settings.STORAGES, "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"}}


_n = 0


def usuario(**kw) -> Usuario:
    global _n
    _n += 1
    cel = f"+5730000000{_n:02d}"
    return Usuario.objects.create_user(username=cel, celular=cel, **kw)


def cliente(u: Usuario) -> APIClient:
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=u)[0].key}")
    return c


def vec(seed: int, cerca_de: np.ndarray | None = None, ruido: float = 0.05) -> list[float]:
    rng = np.random.default_rng(seed)
    v = rng.normal(size=768) if cerca_de is None else cerca_de + ruido * rng.normal(size=768)
    return list(v / np.linalg.norm(v))


def jpeg() -> SimpleUploadedFile:
    b = io.BytesIO()
    Image.new("RGB", (32, 32), (180, 140, 90)).save(b, "JPEG")
    return SimpleUploadedFile("r.jpg", b.getvalue(), content_type="image/jpeg")


def reporte(autor, tipo="encontrado", especie="perro", lat=SUBA[0], lng=SUBA[1], v=None, **kw) -> Reporte:
    r = Reporte.objects.create(
        autor=autor, tipo=tipo, especie=especie, fecha_evento=kw.pop("fecha", date(2026, 11, 10)),
        zona_nombre="Suba", lat_exacta=lat, lng_exacta=lng, **kw,
    )
    Caso.objects.create(reporte=r)
    if v is not None:
        FotoRecorte.objects.create(reporte=r, recorte=jpeg(), vector=v, modelo="test", especie_detectada=especie,
                                   confianza_detector=0.9)
    return r


def payload(**kw):
    return {
        "tipo": "perdido", "especie": "perro", "nombre": "Toby", "fecha_evento": "2026-11-10",
        "zona_nombre": "Suba", "lat": SUBA[0], "lng": SUBA[1], "autoriza_ubicacion": True, **kw,
    }


# ------------------------------------------------------------ ubicación y consentimiento


def test_listado_publico_no_expone_coordenada_exacta():  # RF-15, RNF-03
    u = usuario()
    r = cliente(u).post("/api/reportes/", payload(), format="json")
    assert r.status_code == 201, r.data
    publico = APIClient().get("/api/reportes/").json()["results"][0]
    assert "lat_exacta" not in str(publico) and "lng_exacta" not in str(publico)
    z = publico["zona"]
    assert (z["lat"], z["lng"]) != SUBA
    assert z["radio_m"] == 500
    assert distancia_km(SUBA[0], SUBA[1], z["lat"], z["lng"]) <= 0.5


def test_publicar_exige_autorizacion_de_ubicacion():  # HU-02, sección 4.1
    r = cliente(usuario()).post("/api/reportes/", payload(autoriza_ubicacion=False), format="json")
    assert r.status_code == 400
    assert Reporte.objects.count() == 0


def test_publicar_guarda_consentimiento_y_abre_caso():  # RF-06, RNF-04
    u = usuario()
    cliente(u).post("/api/reportes/", payload(), format="json")
    rep = Reporte.objects.get()
    assert rep.caso.estado == Caso.Estado.ACTIVO
    assert rep.caso.eventos.count() == 1
    assert Consentimiento.objects.filter(usuario=u, tipo="ubicacion").exists()


def test_limite_diario_de_reportes(settings):  # RF-17
    settings.PAWCONNECT = {**settings.PAWCONNECT, "MAX_REPORTES_POR_DIA": 2}
    c = cliente(usuario())
    assert c.post("/api/reportes/", payload(), format="json").status_code == 201
    assert c.post("/api/reportes/", payload(), format="json").status_code == 201
    assert c.post("/api/reportes/", payload(), format="json").status_code == 400


# ------------------------------------------------------------ fotos


def test_foto_sin_animal_se_rechaza(): # RF-03
    u = usuario()
    rep = reporte(u, tipo="perdido")
    resp = mock.Mock(status_code=422)
    resp.json.return_value = {"detail": {"codigo": "sin_animal", "mensaje": "No vemos un perro o un gato."}}
    with mock.patch("reportes.servicios.httpx.post", return_value=resp):
        r = cliente(u).post(f"/api/reportes/{rep.id}/fotos/", {"foto": jpeg()}, format="multipart")
    assert r.status_code == 422 and r.json()["codigo"] == "sin_animal"
    assert rep.fotos.count() == 0


def test_foto_valida_guarda_solo_recorte_y_vector():  # RN-04
    import base64

    u = usuario()
    rep = reporte(u, tipo="perdido")
    resp = mock.Mock(status_code=200)
    resp.json.return_value = {
        "especie": "perro", "confianza": 0.6, "modelo": "facebook/dinov2-base", "dimension": 768,
        "vector": vec(1), "recorte_jpeg": base64.b64encode(jpeg().read()).decode(),
    }
    with mock.patch("reportes.servicios.httpx.post", return_value=resp):
        r = cliente(u).post(f"/api/reportes/{rep.id}/fotos/", {"foto": jpeg()}, format="multipart")
    assert r.status_code == 201, r.data
    foto = rep.fotos.get()
    assert foto.recorte.name.startswith(f"recortes/{rep.id}/") and len(foto.vector) == 768


# ------------------------------------------------------------ búsqueda


def test_busqueda_ordena_y_filtra():  # RF-04, RF-19, RN-02, RN-03
    duena, otros = usuario(), usuario()
    base = np.array(vec(7))
    perdido = reporte(duena, tipo="perdido", v=list(base))

    muy_parecido = reporte(otros, v=vec(8, base, 0.02))
    parecido = reporte(otros, tipo="visto", v=vec(9, base, 0.06))
    distinto = reporte(otros, v=vec(10))
    gato = reporte(otros, especie="gato", v=vec(11, base, 0.01))  # otra especie
    lejos = reporte(otros, lat=4.60, lng=-74.08, v=vec(12, base, 0.01))  # ~15,7 km
    viejo = reporte(otros, fecha=date(2026, 8, 1), v=vec(13, base, 0.01))  # > 60 días
    otro_perdido = reporte(otros, tipo="perdido", v=vec(14, base, 0.01))  # mismo tipo
    propio = reporte(duena, v=vec(15, base, 0.01))  # mismo autor

    cands = buscar_candidatos(perdido)
    ids = [c.propuesto_id for c in cands]
    assert ids[:2] == [muy_parecido.id, parecido.id]
    assert distinto.id in ids
    for fuera in (gato, lejos, viejo, otro_perdido, propio):
        assert fuera.id not in ids
    assert [c.posicion for c in cands] == list(range(1, len(cands) + 1))

    r = cliente(duena).get(f"/api/reportes/{perdido.id}/candidatos/")
    assert r.status_code == 200
    assert "distancia" not in str(r.json())  # RN-02: nunca un puntaje


def test_descartado_desaparece_y_no_vuelve():  # RF-05, HU-05
    duena, otro = usuario(), usuario()
    base = np.array(vec(20))
    perdido = reporte(duena, tipo="perdido", v=list(base))
    a = reporte(otro, v=vec(21, base, 0.02))
    buscar_candidatos(perdido)
    cand = perdido.candidatos.get(propuesto=a)
    c = cliente(duena)
    assert c.post(f"/api/candidatos/{cand.id}/decision/", {"decision": "descartado"}, format="json").status_code == 200
    c.post(f"/api/reportes/{perdido.id}/candidatos/")
    assert a.id not in [x["reporte"]["id"] for x in c.get(f"/api/reportes/{perdido.id}/candidatos/").json()]


def test_confirmar_no_resuelve_el_caso():  # RN-01
    duena, otro = usuario(), usuario()
    base = np.array(vec(30))
    perdido = reporte(duena, tipo="perdido", v=list(base))
    reporte(otro, v=vec(31, base, 0.02))
    cand = buscar_candidatos(perdido)[0]
    cliente(duena).post(f"/api/candidatos/{cand.id}/decision/", {"decision": "confirmado"}, format="json")
    perdido.caso.refresh_from_db()
    assert perdido.caso.estado == Caso.Estado.SEGUIMIENTO


def test_solo_la_autora_ve_sus_candidatos():
    duena = usuario()
    perdido = reporte(duena, tipo="perdido", v=vec(40))
    assert cliente(usuario()).get(f"/api/reportes/{perdido.id}/candidatos/").status_code == 403


# ------------------------------------------------------------ contacto


def test_telefono_solo_con_las_dos_llaves():  # RN-05, RF-07
    duena, quien = usuario(), usuario()
    base = np.array(vec(50))
    perdido = reporte(duena, tipo="perdido", v=list(base))
    reporte(quien, v=vec(51, base, 0.02))
    cand = buscar_candidatos(perdido)[0]
    cand.decision = Candidato.Decision.CONFIRMADO
    cand.save()

    cd, cq = cliente(duena), cliente(quien)
    r = cd.post("/api/contacto/", {"candidato": cand.id, "mensaje_inicial": "Creo que es Toby"}, format="json")
    assert r.status_code == 201, r.data
    sid = r.json()["id"]
    assert quien.celular not in str(r.json())
    assert r.json()["telefono_otra_parte"].endswith(quien.celular[-2:])

    assert cd.post(f"/api/contacto/{sid}/aceptar/").status_code == 403  # no puede aceptar por la otra parte
    assert cq.post(f"/api/contacto/{sid}/aceptar/").status_code == 200
    assert cd.get(f"/api/contacto/{sid}/").json()["telefono_otra_parte"] == quien.celular
    assert SolicitudContacto.objects.get().abierto


# ------------------------------------------------------------ cuentas


def test_cuenta_nueva_exige_consentimiento():  # RF-01, RF-13
    cel = "+573001112233"
    _, codigo = CodigoVerificacion.emitir(cel)
    c = APIClient()
    r = c.post("/api/cuentas/verificar/", {"celular": cel, "codigo": codigo}, format="json")
    assert r.status_code == 400 and r.json()["codigo"] == "falta_consentimiento"

    _, codigo = CodigoVerificacion.emitir(cel)
    r = c.post("/api/cuentas/verificar/", {"celular": cel, "codigo": codigo, "acepta_tratamiento": True}, format="json")
    assert r.status_code == 200 and r.json()["token"]
    u = Usuario.objects.get(celular=cel)
    assert u.nivel_verificacion == Usuario.Nivel.CELULAR
    assert u.consentimientos.filter(tipo="cuenta").exists()


def test_codigo_incorrecto_no_entra():  # RF-01
    cel = "+573004445566"
    CodigoVerificacion.emitir(cel)
    r = APIClient().post("/api/cuentas/verificar/", {"celular": cel, "codigo": "000000", "acepta_tratamiento": True}, format="json")
    assert r.status_code == 400
    assert not Usuario.objects.filter(celular=cel).exists()


def test_mios_devuelve_solo_los_reportes_del_usuario():  # Mis casos
    autor = usuario()
    otro = usuario()
    mio = reporte(autor, tipo="perdido")
    reporte(otro, tipo="encontrado")
    r = cliente(autor).get("/api/reportes/mios/")
    assert r.status_code == 200
    ids = [item["id"] for item in r.json()]
    assert str(mio.id) in ids


def test_codigo_informa_si_la_cuenta_ya_existe():  # RN-09
    u = usuario(nombre_publico="Nombre original")
    r = APIClient().post("/api/cuentas/codigo/", {"celular": u.celular}, format="json")
    assert r.status_code == 202
    assert r.json()["cuenta_existente"] is True

    _, codigo = CodigoVerificacion.emitir(u.celular)
    r = APIClient().post(
        "/api/cuentas/verificar/",
        {"celular": u.celular, "codigo": codigo, "nombre_publico": "Nombre distinto", "acepta_tratamiento": False},
        format="json",
    )
    assert r.status_code == 200
    u.refresh_from_db()
    assert u.nombre_publico == "Nombre original"
