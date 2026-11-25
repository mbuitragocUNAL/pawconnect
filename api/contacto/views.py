from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from reportes.models import Candidato

from .models import Mensaje, SolicitudContacto


class MensajeSerializer(serializers.ModelSerializer):
    mio = serializers.SerializerMethodField()

    class Meta:
        model = Mensaje
        fields = ["id", "texto", "enviado_en", "mio"]
        read_only_fields = ["id", "enviado_en", "mio"]

    def get_mio(self, obj) -> bool:
        return obj.autor_id == self.context["request"].user.id


class SolicitudSerializer(serializers.ModelSerializer):
    """`telefono_otra_parte` va enmascarado hasta que las dos partes aceptan (RF-07, RN-05)."""

    estado = serializers.CharField(read_only=True)
    soy = serializers.SerializerMethodField()
    telefono_otra_parte = serializers.SerializerMethodField()
    reporte = serializers.SerializerMethodField()
    candidato = serializers.PrimaryKeyRelatedField(queryset=Candidato.objects.all(), write_only=True)

    class Meta:
        model = SolicitudContacto
        fields = [
            "id",
            "candidato",
            "estado",
            "soy",
            "acepto_solicitante_en",
            "acepto_receptor_en",
            "mensaje_inicial",
            "telefono_otra_parte",
            "reporte",
            "creada_en",
        ]
        read_only_fields = ["acepto_solicitante_en", "acepto_receptor_en", "creada_en"]

    def get_soy(self, obj) -> str:
        return "solicitante" if obj.solicitante_id == self.context["request"].user.id else "receptor"

    def get_telefono_otra_parte(self, obj) -> str:
        return obj.telefono_de(self.context["request"].user)

    def get_reporte(self, obj) -> dict[str, str] | None:
        if obj.candidato is None:
            return None
        reporte = obj.candidato.propuesto
        return {
            "nombre": reporte.nombre,
            "especie": reporte.especie,
            "tipo": reporte.tipo,
            "zona": reporte.zona_nombre,
        }


class SolicitudViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = SolicitudSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        return SolicitudContacto.objects.filter(Q(solicitante=u) | Q(receptor=u)).select_related(
            "solicitante", "receptor", "candidato__propuesto"
        )

    def perform_create(self, serializer):
        candidato = serializer.validated_data["candidato"]
        if candidato.consulta.autor_id != self.request.user.id:
            raise PermissionDenied("Solo puedes pedir contacto desde tus propios candidatos.")
        if candidato.decision != Candidato.Decision.CONFIRMADO:
            raise ValidationError({"codigo": "sin_confirmar", "detail": "Primero confirma que puede ser tu animal."})
        serializer.save(solicitante=self.request.user, receptor=candidato.propuesto.autor)

    def _soy_receptor(self, s):
        if s.receptor_id != self.request.user.id:
            raise PermissionDenied("Solo la otra parte puede responder esta solicitud.")

    @extend_schema(request=None)
    @action(detail=True, methods=["post"])
    def aceptar(self, request, pk=None):
        """La segunda llave. Desde aquí las dos partes ven el teléfono completo."""
        s = self.get_object()
        self._soy_receptor(s)
        s.acepto_receptor_en = timezone.now()
        s.save(update_fields=["acepto_receptor_en"])
        return Response(self.get_serializer(s).data)

    @extend_schema(request=None)
    @action(detail=True, methods=["post"])
    def rechazar(self, request, pk=None):
        s = self.get_object()
        self._soy_receptor(s)
        s.rechazado_en = timezone.now()
        s.save(update_fields=["rechazado_en"])
        return Response(self.get_serializer(s).data)

    @extend_schema(methods=["POST"], request=MensajeSerializer, responses=MensajeSerializer)
    @extend_schema(methods=["GET"], responses=MensajeSerializer(many=True))
    @action(detail=True, methods=["get", "post"])
    def mensajes(self, request, pk=None):
        s = self.get_object()
        if request.method == "POST":
            if s.estado == SolicitudContacto.Estado.RECHAZADO:
                raise ValidationError({"detail": "Esta solicitud fue rechazada."})
            m = MensajeSerializer(data=request.data, context={"request": request})
            m.is_valid(raise_exception=True)
            m.save(solicitud=s, autor=request.user)
        return Response(MensajeSerializer(s.mensajes.all(), many=True, context={"request": request}).data)
