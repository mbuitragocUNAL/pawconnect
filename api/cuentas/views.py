import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import CodigoVerificacion, Consentimiento, SuscripcionAlerta, Usuario, celular_co

log = logging.getLogger(__name__)


class CodigoThrottle(AnonRateThrottle):
    rate = "5/hour"


class PedirCodigo(serializers.Serializer):
    celular = serializers.CharField(validators=[celular_co])


class Verificar(serializers.Serializer):
    celular = serializers.CharField(validators=[celular_co])
    codigo = serializers.RegexField(r"^\d{6}$")
    nombre_publico = serializers.CharField(max_length=60, required=False, allow_blank=True)
    acepta_tratamiento = serializers.BooleanField(
        default=False, help_text="Casilla sin marcar por defecto. Obligatoria para crear la cuenta (RF-13)."
    )
    version_texto = serializers.CharField(default="2026-11")


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "nombre_publico", "celular", "rol", "nivel_verificacion", "zona_principal"]
        read_only_fields = ["id", "celular", "rol", "nivel_verificacion"]


@extend_schema(request=PedirCodigo, responses={202: inline_serializer("CodigoEnviado", {"enviado": serializers.BooleanField()})})
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([CodigoThrottle])
def pedir_codigo(request):
    """Envía un código de 6 dígitos por SMS (RF-01).

    El proveedor de SMS está por confirmar (sección 7). Mientras tanto, en desarrollo
    el código se escribe en el log del servidor.
    """
    s = PedirCodigo(data=request.data)
    s.is_valid(raise_exception=True)
    _, codigo = CodigoVerificacion.emitir(s.validated_data["celular"])
    if settings.DEBUG:
        log.warning("Código SMS para %s: %s", s.validated_data["celular"], codigo)
    # TODO: enviar por el proveedor de SMS elegido.
    return Response({"enviado": True}, status=status.HTTP_202_ACCEPTED)


@extend_schema(
    request=Verificar,
    responses={200: inline_serializer("Sesion", {"token": serializers.CharField(), "usuario": UsuarioSerializer()})},
)
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([CodigoThrottle])
@transaction.atomic
def verificar_codigo(request):
    """Verifica el código. Si el número es nuevo, crea la cuenta (una por celular, RN-09)."""
    s = Verificar(data=request.data)
    s.is_valid(raise_exception=True)
    d = s.validated_data
    codigo = CodigoVerificacion.objects.filter(celular=d["celular"], usado_en__isnull=True).order_by("-creado_en").first()
    if not codigo or not codigo.verificar(d["codigo"]):
        return Response({"codigo": "codigo_invalido", "detail": "El código no es correcto o ya venció."}, status=400)

    usuario = Usuario.objects.filter(celular=d["celular"]).first()
    if usuario is None:
        if not d["acepta_tratamiento"]:
            return Response(
                {"codigo": "falta_consentimiento", "detail": "Para crear la cuenta acepta el tratamiento de datos."},
                status=400,
            )
        usuario = Usuario.objects.create_user(
            username=d["celular"], celular=d["celular"], nombre_publico=d.get("nombre_publico", "")
        )
        usuario.set_unusable_password()
        Consentimiento.objects.create(usuario=usuario, tipo=Consentimiento.Tipo.CUENTA, version_texto=d["version_texto"])
    usuario.celular_verificado_en = timezone.now()
    usuario.nivel_verificacion = max(usuario.nivel_verificacion, Usuario.Nivel.CELULAR)
    usuario.save()
    token, _ = Token.objects.get_or_create(user=usuario)
    return Response({"token": token.key, "usuario": UsuarioSerializer(usuario).data})


@extend_schema(methods=["GET", "PATCH"], request=UsuarioSerializer, responses=UsuarioSerializer)
@extend_schema(methods=["DELETE"], responses={202: None})
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def yo(request):
    """Mi perfil. DELETE pide borrar la cuenta y los datos personales (RF-13, RNF-05)."""
    u = request.user
    if request.method == "DELETE":
        u.eliminacion_solicitada_en = timezone.now()
        u.is_active = False
        u.save(update_fields=["eliminacion_solicitada_en", "is_active"])
        Token.objects.filter(user=u).delete()
        # TODO: tarea que borra datos personales en ≤ 15 días hábiles y registra la acción.
        return Response(status=status.HTTP_202_ACCEPTED)
    if request.method == "PATCH":
        s = UsuarioSerializer(u, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
    return Response(UsuarioSerializer(u).data)


class AlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuscripcionAlerta
        fields = ["id", "zona_nombre", "lat", "lng", "radio_km", "activa"]


class AlertaViewSet(viewsets.ModelViewSet):
    """Mis alertas por zona (RF-11). Llegan apagadas: la persona las activa."""

    serializer_class = AlertaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SuscripcionAlerta.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
