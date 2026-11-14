"""Fundaciones y prestadores verificados (RF-08, RF-10, RF-14).

Modelo de datos, sección 7.1: Organización, AnimalAdopción.
"""

from django.conf import settings
from django.db import models


class Organizacion(models.Model):
    class Tipo(models.TextChoices):
        FUNDACION = "fundacion", "Fundación o refugio"
        PRESTADOR = "prestador", "Prestador de servicios"

    class Sello(models.TextChoices):
        NINGUNO = "ninguno", "Sin sello"
        EN_REVISION = "en_revision", "Verificación en revisión"
        APROBADO = "aprobado", "Sello aprobado"
        RETIRADO = "retirado", "Sello retirado"

    class Categoria(models.TextChoices):
        VETERINARIA = "veterinaria", "Veterinaria"
        GUARDERIA = "guarderia", "Guardería"
        PASEADOR = "paseador", "Paseador"
        PELUQUERIA = "peluqueria", "Peluquería"
        REFUGIO = "refugio", "Refugio"

    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    nombre = models.CharField(max_length=120)
    responsable = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="organizaciones")
    descripcion = models.TextField(blank=True)
    categorias = models.JSONField(default=list, blank=True, help_text="Lista de Categoria.")
    horarios = models.JSONField(default=dict, blank=True, help_text='{"lun": "8:00-18:00", …}')
    urgencias_24h = models.BooleanField(default=False)
    zona_nombre = models.CharField(max_length=80)
    # Un lugar fijo sí se muestra como punto (no es un dato personal del cuidador).
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    sitio_web = models.URLField(blank=True)

    # Verificación (RF-14). RN-06: los documentos se borran tras la revisión; queda el resultado y la fecha.
    sello = models.CharField(max_length=12, choices=Sello.choices, default=Sello.NINGUNO)
    verificado_en = models.DateTimeField(null=True, blank=True)
    resultado_verificacion = models.CharField(max_length=200, blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "organización"
        verbose_name_plural = "organizaciones"

    def __str__(self) -> str:
        return self.nombre

    @property
    def verificada(self) -> bool:
        return self.sello == self.Sello.APROBADO


class AnimalAdopcion(models.Model):
    class Estado(models.TextChoices):
        DISPONIBLE = "disponible", "Disponible"
        EN_PROCESO = "en_proceso", "En proceso"
        ADOPTADO = "adoptado", "Adoptado"

    organizacion = models.ForeignKey(Organizacion, on_delete=models.CASCADE, related_name="animales")
    nombre = models.CharField(max_length=60)
    especie = models.CharField(max_length=8, choices=[("perro", "Perro"), ("gato", "Gato")])
    edad_aproximada = models.CharField(max_length=30, blank=True)
    tamano = models.CharField(max_length=8, blank=True)
    ficha = models.TextField(blank=True, help_text="Carácter, salud, esterilización, vacunas.")
    requisitos = models.TextField(blank=True)
    foto = models.ImageField(upload_to="adopcion/", blank=True)
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.DISPONIBLE)
    publicado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "animal en adopción"
        verbose_name_plural = "animales en adopción"
        ordering = ["-publicado_en"]

    def __str__(self) -> str:
        return f"{self.nombre} · {self.organizacion}"
