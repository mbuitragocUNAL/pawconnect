"""Moderación y auditoría (RF-12, RF-16, RF-18). Modelos ReportePerfil y Auditoría."""

from django.conf import settings
from django.db import models


class ReportePerfil(models.Model):
    """Cualquier usuario puede reportar un perfil sospechoso (RF-16)."""

    class Estado(models.TextChoices):
        ABIERTO = "abierto", "Abierto"
        FUNDADO = "fundado", "Fundado"
        DESCARTADO = "descartado", "Descartado"

    organizacion = models.ForeignKey(
        "organizaciones.Organizacion", null=True, blank=True, on_delete=models.CASCADE, related_name="denuncias"
    )
    usuario_reportado = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="denuncias_recibidas"
    )
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="denuncias_hechas")
    motivo = models.TextField(max_length=1000)
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.ABIERTO)
    creado_en = models.DateTimeField(auto_now_add=True)
    resuelto_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "reporte de perfil"
        verbose_name_plural = "reportes de perfil"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(organizacion__isnull=False) | models.Q(usuario_reportado__isnull=False),
                name="reporte_perfil_con_objetivo",
            )
        ]


class Auditoria(models.Model):
    """Cada acción de un administrador queda registrada (RF-12, RF-18).

    Solo se agrega: nadie edita ni borra filas desde la app.
    """

    administrador = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    accion = models.CharField(max_length=40, help_text="ver_documento, aprobar_sello, retirar_sello, borrar_cuenta…")
    objeto_tipo = models.CharField(max_length=60)
    objeto_id = models.CharField(max_length=64)
    detalle = models.CharField(max_length=280, blank=True)
    en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "registro de auditoría"
        verbose_name_plural = "auditoría"
        ordering = ["-en"]

    @classmethod
    def registrar(cls, administrador, accion: str, objeto, detalle: str = "") -> "Auditoria":
        return cls.objects.create(
            administrador=administrador,
            accion=accion,
            objeto_tipo=objeto._meta.label,
            objeto_id=str(objeto.pk),
            detalle=detalle,
        )
