"""Cuentas: usuarios con celular verificado, consentimientos y alertas por zona.

Modelo de datos, sección 7.1: Usuario, Consentimiento, SuscripciónAlerta.
"""

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser, UserManager
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

celular_co = RegexValidator(r"^\+57\d{10}$", "Escribe el celular con +57 y 10 dígitos.")


class UsuarioManager(UserManager):
    def create_user(self, username=None, email=None, password=None, **extra):
        username = username or extra.get("celular")
        return super().create_user(username, email, password, **extra)


class Usuario(AbstractUser):
    """Una cuenta por número de celular (RN-09).

    `username` es el celular, para que el admin de Django funcione sin cambios.
    """

    class Rol(models.TextChoices):
        # RNF-06: tres roles con acceso mínimo. Las fundaciones son usuarios con
        # una Organización de tipo fundación y sello aprobado.
        USUARIO = "usuario", "Usuario"
        PRESTADOR = "prestador", "Prestador"
        ADMINISTRADOR = "administrador", "Administrador"

    class Nivel(models.IntegerChoices):
        VISITANTE = 0, "Visitante"
        CELULAR = 1, "Celular verificado"
        FUNDACION = 2, "Fundación verificada"
        PRESTADOR = 3, "Prestador verificado"

    celular = models.CharField(max_length=13, unique=True, validators=[celular_co])
    celular_verificado_en = models.DateTimeField(null=True, blank=True)
    nombre_publico = models.CharField(
        max_length=60, blank=True, help_text="Lo que ven los demás. Nunca el teléfono."
    )
    rol = models.CharField(max_length=16, choices=Rol.choices, default=Rol.USUARIO)
    nivel_verificacion = models.PositiveSmallIntegerField(choices=Nivel.choices, default=Nivel.VISITANTE)
    zona_principal = models.CharField(max_length=80, blank=True)
    eliminacion_solicitada_en = models.DateTimeField(null=True, blank=True)  # RF-13

    objects = UsuarioManager()
    REQUIRED_FIELDS = ["celular"]

    class Meta:
        verbose_name = "usuario"

    def __str__(self) -> str:
        return self.nombre_publico or f"Usuario {self.pk}"

    @property
    def celular_enmascarado(self) -> str:
        """+57 3•• ••• ••47: lo único que se muestra antes de las dos llaves (RN-05)."""
        return f"+57 3•• ••• ••{self.celular[-2:]}" if self.celular else ""


class Consentimiento(models.Model):
    """Autorización previa, expresa e informada (Ley 1581, RF-13, RNF-04).

    Se crea solo cuando la persona marca la casilla; nunca viene marcada.
    """

    class Tipo(models.TextChoices):
        CUENTA = "cuenta", "Tratamiento de datos de la cuenta"
        UBICACION = "ubicacion", "Ubicación aproximada al publicar"

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consentimientos")
    tipo = models.CharField(max_length=16, choices=Tipo.choices)
    version_texto = models.CharField(max_length=20, help_text="Versión del texto aceptado, p. ej. 2026-11.")
    aceptado_en = models.DateTimeField(default=timezone.now)
    retirado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-aceptado_en"]

    def __str__(self) -> str:
        return f"{self.get_tipo_display()} v{self.version_texto}"


class CodigoVerificacion(models.Model):
    """Código de un solo uso por SMS (RF-01). Se guarda solo su hash."""

    celular = models.CharField(max_length=13, validators=[celular_co], db_index=True)
    codigo_hash = models.CharField(max_length=64)
    creado_en = models.DateTimeField(auto_now_add=True)
    vence_en = models.DateTimeField()
    intentos = models.PositiveSmallIntegerField(default=0)
    usado_en = models.DateTimeField(null=True, blank=True)

    @staticmethod
    def _hash(codigo: str) -> str:
        return hashlib.sha256(codigo.encode()).hexdigest()

    @classmethod
    def emitir(cls, celular: str) -> tuple["CodigoVerificacion", str]:
        codigo = f"{secrets.randbelow(10**6):06d}"
        minutos = settings.PAWCONNECT["CODIGO_SMS_MINUTOS"]
        obj = cls.objects.create(
            celular=celular, codigo_hash=cls._hash(codigo), vence_en=timezone.now() + timedelta(minutes=minutos)
        )
        return obj, codigo

    def verificar(self, codigo: str) -> bool:
        if self.usado_en or timezone.now() > self.vence_en:
            return False
        if self.intentos >= settings.PAWCONNECT["CODIGO_SMS_INTENTOS"]:
            return False
        self.intentos += 1
        ok = secrets.compare_digest(self.codigo_hash, self._hash(codigo))
        if ok:
            self.usado_en = timezone.now()
        self.save(update_fields=["intentos", "usado_en"])
        return ok


class SuscripcionAlerta(models.Model):
    """Alertas por zona, solo para quien las activa (RF-11, HU-09)."""

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="alertas")
    zona_nombre = models.CharField(max_length=80)
    lat = models.FloatField()
    lng = models.FloatField()
    radio_km = models.PositiveSmallIntegerField(default=5)
    activa = models.BooleanField(default=False)
    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.zona_nombre} · {self.radio_km} km"
