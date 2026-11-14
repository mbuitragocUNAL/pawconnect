from rest_framework import mixins, permissions, serializers, viewsets

from .models import ReportePerfil


class ReportePerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportePerfil
        fields = ["id", "organizacion", "usuario_reportado", "motivo", "estado", "creado_en"]
        read_only_fields = ["estado", "creado_en"]

    def validate(self, data):
        if not data.get("organizacion") and not data.get("usuario_reportado"):
            raise serializers.ValidationError("Indica qué perfil reportas.")
        return data


class ReportePerfilViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Reportar un perfil sospechoso (RF-16). Lo revisa un administrador en el panel."""

    serializer_class = ReportePerfilSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)
