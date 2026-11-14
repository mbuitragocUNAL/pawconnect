"""Contacto intermediado: las dos llaves (RF-07, RN-05). Modelo SolicitudContacto."""

from django.conf import settings
from django.db import models
from django.utils import timezone


class SolicitudContacto(models.Model):
    class Estado(models.TextChoices):
        ESPERANDO = "esperando", "Esperando a la otra parte"
        ABIERTO = "abierto", "Las dos partes aceptaron"
        RECHAZADO = "rechazado", "Rechazada"

    candidato = models.ForeignKey(
        "reportes.Candidato", null=True, blank=True, on_delete=models.SET_NULL, related_name="solicitudes"
    )
    solicitante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    receptor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    acepto_solicitante_en = models.DateTimeField(default=timezone.now)
    acepto_receptor_en = models.DateTimeField(null=True, blank=True)
    rechazado_en = models.DateTimeField(null=True, blank=True)
    mensaje_inicial = models.CharField(max_length=280, blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creada_en"]

    @property
    def estado(self) -> str:
        if self.rechazado_en:
            return self.Estado.RECHAZADO
        if self.acepto_solicitante_en and self.acepto_receptor_en:
            return self.Estado.ABIERTO
        return self.Estado.ESPERANDO

    @property
    def abierto(self) -> bool:
        """El teléfono se revela solo si esto es verdadero (RN-05)."""
        return self.estado == self.Estado.ABIERTO

    def telefono_de(self, usuario) -> str:
        """Teléfono de la otra parte: completo solo con las dos llaves."""
        otro = self.receptor if usuario == self.solicitante else self.solicitante
        return otro.celular if self.abierto else otro.celular_enmascarado


class Mensaje(models.Model):
    solicitud = models.ForeignKey(SolicitudContacto, on_delete=models.CASCADE, related_name="mensajes")
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    texto = models.TextField(max_length=1000)
    enviado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["enviado_en"]
