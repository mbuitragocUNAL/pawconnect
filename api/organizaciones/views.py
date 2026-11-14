from rest_framework import mixins, permissions, serializers, viewsets
from rest_framework.exceptions import PermissionDenied

from .models import AnimalAdopcion, Organizacion


class OrganizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizacion
        fields = [
            "id",
            "tipo",
            "nombre",
            "descripcion",
            "categorias",
            "horarios",
            "urgencias_24h",
            "zona_nombre",
            "lat",
            "lng",
            "sitio_web",
            "sello",
            "verificado_en",
        ]


class OrganizacionViewSet(viewsets.ReadOnlyModelViewSet):
    """Fundaciones y prestadores con sello aprobado (RF-10, RF-14).

    Filtros: `tipo`, `categoria`, `urgencias=1`.
    """

    serializer_class = OrganizacionSerializer

    def get_queryset(self):
        qs = Organizacion.objects.filter(sello=Organizacion.Sello.APROBADO)
        p = self.request.query_params
        if p.get("tipo"):
            qs = qs.filter(tipo=p["tipo"])
        if p.get("categoria"):
            qs = qs.filter(categorias__contains=[p["categoria"]])
        if p.get("urgencias") in {"1", "true"}:
            qs = qs.filter(urgencias_24h=True)
        return qs


class AnimalSerializer(serializers.ModelSerializer):
    organizacion_nombre = serializers.CharField(source="organizacion.nombre", read_only=True)

    class Meta:
        model = AnimalAdopcion
        fields = [
            "id",
            "organizacion",
            "organizacion_nombre",
            "nombre",
            "especie",
            "edad_aproximada",
            "tamano",
            "ficha",
            "requisitos",
            "foto",
            "estado",
            "publicado_en",
        ]


class AnimalViewSet(mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    """Animales en adopción. Publicar exige una fundación con sello aprobado (RF-08)."""

    serializer_class = AnimalSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = AnimalAdopcion.objects.filter(organizacion__sello=Organizacion.Sello.APROBADO).select_related("organizacion")
        p = self.request.query_params
        if p.get("especie"):
            qs = qs.filter(especie=p["especie"])
        if p.get("estado"):
            qs = qs.filter(estado=p["estado"])
        return qs

    def perform_create(self, serializer):
        org = serializer.validated_data["organizacion"]
        if (
            org.responsable_id != self.request.user.id
            or org.tipo != Organizacion.Tipo.FUNDACION
            or not org.verificada
        ):
            raise PermissionDenied("Solo una fundación con sello aprobado puede publicar animales en adopción.")
        serializer.save()
