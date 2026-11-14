"""Guías y trámites con fuente oficial y fecha (RF-09). Modelo GuíaTrámite."""

from django.db import models


class GuiaTramite(models.Model):
    class Categoria(models.TextChoices):
        TENENCIA = "tenencia", "Tenencia responsable"
        SALUD = "salud", "Vacunas y salud"
        VIAJES = "viajes", "Viajes y transporte"
        PERDIDA = "perdida", "Si se pierde"
        TRAMITES = "tramites", "Trámites"

    titulo = models.CharField(max_length=140)
    slug = models.SlugField(unique=True)
    categoria = models.CharField(max_length=12, choices=Categoria.choices)
    resumen = models.CharField(max_length=280)
    contenido = models.TextField(help_text="Markdown.")
    fuente_nombre = models.CharField(max_length=120, help_text="Entidad oficial, p. ej. IDPYBA.")
    fuente_url = models.URLField()
    actualizado_en = models.DateField(help_text="Fecha en que se revisó contra la fuente.")
    publicada = models.BooleanField(default=False)

    class Meta:
        verbose_name = "guía de trámite"
        verbose_name_plural = "guías de trámites"
        ordering = ["categoria", "titulo"]

    def __str__(self) -> str:
        return self.titulo
