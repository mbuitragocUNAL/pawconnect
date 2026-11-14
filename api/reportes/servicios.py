"""Lógica del Módulo 1: procesar fotos con el servicio de reconocimiento y buscar candidatos."""

from __future__ import annotations

import base64
import math
from datetime import timedelta

import httpx
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Min, Q
from django.utils import timezone
from pgvector.django import CosineDistance

from .models import Candidato, FotoRecorte, Reporte



class FotoRechazada(Exception):
    """La foto no sirve (RF-03). `codigo` y `mensaje` vienen del servicio de reconocimiento."""

    def __init__(self, codigo: str, mensaje: str, status: int = 422):
        super().__init__(mensaje)
        self.codigo, self.mensaje, self.status = codigo, mensaje, status


class ReconocimientoNoDisponible(Exception):
    pass


def procesar_foto(reporte: Reporte, archivo) -> FotoRecorte:
    """Manda la foto al servicio de reconocimiento y guarda solo recorte + vector (RN-04).

    La foto original no se escribe en disco: se lee en memoria y se reenvía.
    """
    if reporte.fotos.count() >= settings.PAWCONNECT["MAX_FOTOS_POR_REPORTE"]:
        raise FotoRechazada("limite_fotos", "Un reporte lleva máximo 5 fotos.", status=400)

    datos = archivo.read()
    try:
        r = httpx.post(
            f"{settings.PAWCONNECT['RECONOCIMIENTO_URL']}/procesar",
            files={"foto": (getattr(archivo, "name", "foto.jpg"), datos, getattr(archivo, "content_type", None))},
            timeout=settings.PAWCONNECT["RECONOCIMIENTO_TIMEOUT_S"],
        )
    except httpx.HTTPError as e:
        raise ReconocimientoNoDisponible(str(e)) from e
    finally:
        del datos

    if r.status_code in (413, 415, 422):
        detalle = r.json().get("detail", {})
        raise FotoRechazada(detalle.get("codigo", "rechazada"), detalle.get("mensaje", "La foto no sirve."), r.status_code)
    if r.status_code != 200:
        raise ReconocimientoNoDisponible(f"reconocimiento respondió {r.status_code}")

    res = r.json()
    foto = FotoRecorte(
        reporte=reporte,
        orden=reporte.fotos.count(),
        vector=res["vector"],
        modelo=res["modelo"],
        especie_detectada=res["especie"],
        confianza_detector=res["confianza"],
    )
    foto.recorte.save("recorte.jpg", ContentFile(base64.b64decode(res["recorte_jpeg"])), save=False)
    foto.save()
    return foto


def distancia_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def reportes_comparables(reporte: Reporte):
    """Filtros antes de comparar vectores (RN-03, RF-19).

    Misma especie, tipo opuesto, dentro de la ventana de fechas y del radio.
    Usa la coordenada exacta: este cálculo nunca sale del servidor.
    """
    radio = settings.PAWCONNECT["RADIO_BUSQUEDA_KM"]
    dias = settings.PAWCONNECT["VENTANA_BUSQUEDA_DIAS"]
    dlat = radio / 111.32
    dlng = radio / (111.32 * max(0.1, math.cos(math.radians(reporte.lat_exacta))))
    ahora = timezone.now()
    qs = (
        Reporte.objects.filter(
            especie=reporte.especie,
            tipo__in=reporte.tipos_comparables,
            oculto_por_moderacion=False,
            fecha_evento__gte=reporte.fecha_evento - timedelta(days=dias),
            fecha_evento__lte=reporte.fecha_evento + timedelta(days=dias),
            lat_exacta__range=(reporte.lat_exacta - dlat, reporte.lat_exacta + dlat),
            lng_exacta__range=(reporte.lng_exacta - dlng, reporte.lng_exacta + dlng),
            caso__estado__in=["activo", "seguimiento"],
        )
        .exclude(autor=reporte.autor)
        .exclude(Q(tipo=Reporte.Tipo.VISTO) & Q(vence_en__lt=ahora))
    )
    return [
        r.pk
        for r in qs.only("id", "lat_exacta", "lng_exacta")
        if distancia_km(reporte.lat_exacta, reporte.lng_exacta, r.lat_exacta, r.lng_exacta) <= radio
    ]


@transaction.atomic
def buscar_candidatos(reporte: Reporte) -> list[Candidato]:
    """Los 5 reportes más parecidos (RF-04), cada uno puntuado por su foto más parecida.

    Descartados antes por la persona no vuelven a aparecer (HU-05).
    """
    fotos = list(reporte.fotos.all())
    if not fotos:
        return []
    ids = reportes_comparables(reporte)
    descartados = set(
        reporte.candidatos.filter(decision=Candidato.Decision.DESCARTADO).values_list("propuesto_id", flat=True)
    )
    ids = [i for i in ids if i not in descartados]
    if not ids:
        reporte.candidatos.filter(decision=Candidato.Decision.PENDIENTE).delete()
        return []

    mejor: dict = {}
    for f in fotos:
        filas = (
            FotoRecorte.objects.filter(reporte_id__in=ids)
            .annotate(d=CosineDistance("vector", f.vector))
            .values("reporte_id")
            .annotate(m=Min("d"))
        )
        for fila in filas:
            rid, d = fila["reporte_id"], fila["m"]
            if rid not in mejor or d < mejor[rid]:
                mejor[rid] = d

    top = sorted(mejor.items(), key=lambda kv: kv[1])[: settings.PAWCONNECT["CANDIDATOS"]]
    reporte.candidatos.filter(decision=Candidato.Decision.PENDIENTE).delete()
    confirmados = set(
        reporte.candidatos.filter(decision=Candidato.Decision.CONFIRMADO).values_list("propuesto_id", flat=True)
    )
    creados = []
    for pos, (rid, d) in enumerate(top, start=1):
        if rid in confirmados:
            continue
        creados.append(Candidato.objects.create(consulta=reporte, propuesto_id=rid, posicion=pos, distancia=d))
    return creados
