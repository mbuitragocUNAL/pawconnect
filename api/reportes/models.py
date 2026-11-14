"""Módulo 1: reportes, fotos recortadas, casos y candidatos.

Modelo de datos, sección 7.1: Reporte, FotoRecorte, Caso, Candidato.
"""

import math
import random
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from pgvector.django import HnswIndex, VectorField

CFG = settings.PAWCONNECT  # solo para valores fijos al importar (dimensión del vector)


class Especie(models.TextChoices):
    PERRO = "perro", "Perro"
    GATO = "gato", "Gato"


class Reporte(models.Model):
    class Tipo(models.TextChoices):
        PERDIDO = "perdido", "Perdido"
        ENCONTRADO = "encontrado", "Encontrado"
        VISTO = "visto", "Visto en la calle"  # propuesta, ver docs/diseno/01-captura-figma-y-requisitos.md §6

    class Tamano(models.TextChoices):
        PEQUENO = "pequeno", "Pequeño"
        MEDIANO = "mediano", "Mediano"
        GRANDE = "grande", "Grande"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reportes")
    tipo = models.CharField(max_length=12, choices=Tipo.choices)
    especie = models.CharField(max_length=8, choices=Especie.choices)
    nombre = models.CharField(max_length=60, blank=True, help_text="Solo si se conoce.")
    rasgos = models.TextField(blank=True)
    tamano = models.CharField(max_length=8, choices=Tamano.choices, blank=True)
    fecha_evento = models.DateField(help_text="Cuándo se perdió, se encontró o se vio.")

    # Ubicación. La coordenada exacta nunca sale del servidor (RF-15, RNF-03).
    zona_nombre = models.CharField(max_length=80, help_text="Barrio o localidad. Nunca una dirección.")
    lat_exacta = models.FloatField()
    lng_exacta = models.FloatField()
    lat_publica = models.FloatField(editable=False)
    lng_publica = models.FloatField(editable=False)
    coordenada_borrada_en = models.DateTimeField(null=True, blank=True)  # RN-08

    # Solo «visto en la calle»
    hora_aproximada = models.CharField(max_length=20, blank=True)
    direccion_movimiento = models.CharField(max_length=12, blank=True)
    vence_en = models.DateTimeField(null=True, blank=True)

    # Solo «encontrado»
    puede_cuidarlo = models.CharField(max_length=40, blank=True)
    herido = models.BooleanField(default=False)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    oculto_por_moderacion = models.BooleanField(default=False)

    class Meta:
        ordering = ["-creado_en"]
        indexes = [models.Index(fields=["especie", "tipo", "fecha_evento"])]

    def __str__(self) -> str:
        return f"{self.get_tipo_display()} · {self.nombre or self.get_especie_display()} · {self.zona_nombre}"

    def save(self, *args, **kwargs):
        if self.lat_publica is None or self.lng_publica is None:
            self.lat_publica, self.lng_publica = desplazar(self.lat_exacta, self.lng_exacta, settings.PAWCONNECT["RADIO_ZONA_M"])
        if self.tipo == self.Tipo.VISTO and not self.vence_en:
            self.vence_en = timezone.now() + timedelta(days=settings.PAWCONNECT["VIGENCIA_AVISTAMIENTO_DIAS"])
        super().save(*args, **kwargs)

    @property
    def tipos_comparables(self) -> list[str]:
        """RN-03 (con la propuesta «visto»): una pérdida se compara con hallazgos y
        avistamientos; un hallazgo o un avistamiento, con pérdidas."""
        if self.tipo == self.Tipo.PERDIDO:
            return [self.Tipo.ENCONTRADO, self.Tipo.VISTO]
        return [self.Tipo.PERDIDO]


def desplazar(lat: float, lng: float, radio_m: float) -> tuple[float, float]:
    """Centro público: un punto al azar a menos de `radio_m` del real.

    Así el círculo de 500 m contiene el lugar pero su centro no lo delata.
    """
    d = radio_m * math.sqrt(random.random())
    ang = random.uniform(0, 2 * math.pi)
    dlat = (d * math.cos(ang)) / 111_320
    dlng = (d * math.sin(ang)) / (111_320 * math.cos(math.radians(lat)))
    return round(lat + dlat, 5), round(lng + dlng, 5)


def ruta_recorte(instance: "FotoRecorte", filename: str) -> str:
    # Nombre opaco: nada en la ruta deja adivinar otras fotos (RNF-06).
    return f"recortes/{instance.reporte_id}/{uuid.uuid4().hex}.jpg"


class FotoRecorte(models.Model):
    """Solo el recorte del animal; la foto original nunca se guarda (RN-04)."""

    reporte = models.ForeignKey(Reporte, on_delete=models.CASCADE, related_name="fotos")
    orden = models.PositiveSmallIntegerField(default=0)
    recorte = models.ImageField(upload_to=ruta_recorte)
    vector = VectorField(dimensions=CFG["VECTOR_DIM"])
    modelo = models.CharField(max_length=60)
    especie_detectada = models.CharField(max_length=8)
    confianza_detector = models.FloatField()
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["orden", "creada_en"]
        indexes = [
            HnswIndex(
                name="foto_vector_hnsw",
                fields=["vector"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            )
        ]

    def __str__(self) -> str:
        return f"Foto {self.orden + 1} de {self.reporte}"


class Caso(models.Model):
    """Ciclo de vida de un reporte (RF-06). Cada cambio queda en `EventoCaso`."""

    class Estado(models.TextChoices):
        ACTIVO = "activo", "Activo"
        SEGUIMIENTO = "seguimiento", "En seguimiento"
        RESUELTO = "resuelto", "Resuelto"
        CERRADO = "cerrado", "Cerrado"

    reporte = models.OneToOneField(Reporte, on_delete=models.CASCADE, related_name="caso")
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.ACTIVO)
    reencuentro_confirmado_en = models.DateTimeField(null=True, blank=True)
    cerrado_en = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Caso {self.reporte} · {self.get_estado_display()}"

    def cambiar_estado(self, nuevo: str, por, nota: str = "") -> "EventoCaso":
        """Única forma de cambiar el estado. RN-01: «resuelto» solo lo marca una persona."""
        if por is None:
            raise ValueError("Un cambio de estado necesita a la persona que lo hace (RN-01).")
        anterior = self.estado
        self.estado = nuevo
        ahora = timezone.now()
        if nuevo == self.Estado.RESUELTO:
            self.reencuentro_confirmado_en = ahora
        if nuevo in (self.Estado.RESUELTO, self.Estado.CERRADO):
            self.cerrado_en = ahora
        self.save()
        return self.eventos.create(estado_anterior=anterior, estado_nuevo=nuevo, por=por, nota=nota)


class EventoCaso(models.Model):
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE, related_name="eventos")
    estado_anterior = models.CharField(max_length=12, choices=Caso.Estado.choices, blank=True)
    estado_nuevo = models.CharField(max_length=12, choices=Caso.Estado.choices, blank=True)
    nota = models.CharField(max_length=200, blank=True)
    por = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    en = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-en"]


class Candidato(models.Model):
    """Posible coincidencia propuesta por el sistema (RF-04, RF-05).

    `distancia` es interna: la API nunca la expone (RN-02). Solo la posición.
    """

    class Decision(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        CONFIRMADO = "confirmado", "Confirmado"
        DESCARTADO = "descartado", "Descartado"

    consulta = models.ForeignKey(Reporte, on_delete=models.CASCADE, related_name="candidatos")
    propuesto = models.ForeignKey(Reporte, on_delete=models.CASCADE, related_name="propuesto_en")
    posicion = models.PositiveSmallIntegerField()
    distancia = models.FloatField()
    decision = models.CharField(max_length=12, choices=Decision.choices, default=Decision.PENDIENTE)
    decidido_en = models.DateTimeField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["consulta", "posicion"]
        constraints = [models.UniqueConstraint(fields=["consulta", "propuesto"], name="candidato_unico")]
