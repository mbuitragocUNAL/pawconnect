from rest_framework import serializers, viewsets

from .models import GuiaTramite


class GuiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuiaTramite
        fields = ["slug", "titulo", "categoria", "resumen", "contenido", "fuente_nombre", "fuente_url", "actualizado_en"]


class GuiaViewSet(viewsets.ReadOnlyModelViewSet):
    """Guías con su fuente oficial y fecha de actualización (RF-09). Filtro: `categoria`."""

    serializer_class = GuiaSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = GuiaTramite.objects.filter(publicada=True)
        if c := self.request.query_params.get("categoria"):
            qs = qs.filter(categoria=c)
        return qs
