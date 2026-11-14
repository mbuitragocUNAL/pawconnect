from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from cuentas.models import Consentimiento

from .models import Candidato, Caso, EventoCaso, FotoRecorte, Reporte



class ZonaSerializer(serializers.Serializer):
    """El círculo público: centro desplazado + 500 m. Nunca la coordenada exacta (RF-15)."""

    lat = serializers.FloatField(source="lat_publica")
    lng = serializers.FloatField(source="lng_publica")
    radio_m = serializers.SerializerMethodField()
    nombre = serializers.CharField(source="zona_nombre")

    def get_radio_m(self, obj) -> int:
        return settings.PAWCONNECT["RADIO_ZONA_M"]


class FotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoRecorte
        fields = ["id", "orden", "recorte", "especie_detectada"]


class ReportePublicoSerializer(serializers.ModelSerializer):
    """Lo que ve cualquiera. Sin coordenada exacta, sin autor, sin teléfono."""

    zona = ZonaSerializer(source="*")
    fotos = FotoSerializer(many=True, read_only=True)
    estado = serializers.CharField(source="caso.estado", read_only=True)

    class Meta:
        model = Reporte
        fields = [
            "id",
            "tipo",
            "especie",
            "nombre",
            "rasgos",
            "tamano",
            "fecha_evento",
            "zona",
            "fotos",
            "estado",
            "hora_aproximada",
            "direccion_movimiento",
            "vence_en",
            "herido",
            "creado_en",
        ]


class ReporteCrearSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, min_value=-90, max_value=90)
    lng = serializers.FloatField(write_only=True, min_value=-180, max_value=180)
    autoriza_ubicacion = serializers.BooleanField(
        write_only=True, help_text="La casilla de ubicación. Llega en false si no la marcó (HU-02, sección 4.1)."
    )
    version_texto_ubicacion = serializers.CharField(write_only=True, default="2026-11")

    class Meta:
        model = Reporte
        fields = [
            "id",
            "tipo",
            "especie",
            "nombre",
            "rasgos",
            "tamano",
            "fecha_evento",
            "zona_nombre",
            "lat",
            "lng",
            "autoriza_ubicacion",
            "version_texto_ubicacion",
            "hora_aproximada",
            "direccion_movimiento",
            "puede_cuidarlo",
            "herido",
        ]
        read_only_fields = ["id"]

    def validate_autoriza_ubicacion(self, v):
        if not v:
            raise serializers.ValidationError("Para publicar necesitamos tu autorización de ubicación aproximada.")
        return v

    def validate(self, data):
        usuario = self.context["request"].user
        desde = timezone.now() - timedelta(days=1)
        if usuario.reportes.filter(creado_en__gte=desde).count() >= settings.PAWCONNECT["MAX_REPORTES_POR_DIA"]:
            raise serializers.ValidationError(
                {"codigo": "limite_diario", "detail": "Llegaste al límite de reportes por hoy."}  # RF-17
            )
        return data

    @transaction.atomic
    def create(self, data):
        usuario = self.context["request"].user
        version = data.pop("version_texto_ubicacion")
        data.pop("autoriza_ubicacion")
        data["lat_exacta"], data["lng_exacta"] = data.pop("lat"), data.pop("lng")
        Consentimiento.objects.create(usuario=usuario, tipo=Consentimiento.Tipo.UBICACION, version_texto=version)
        reporte = Reporte.objects.create(autor=usuario, **data)
        caso = Caso.objects.create(reporte=reporte)
        EventoCaso.objects.create(caso=caso, estado_nuevo=Caso.Estado.ACTIVO, por=usuario, nota="Reporte publicado")
        return reporte

    def to_representation(self, instance):
        return ReportePublicoSerializer(instance, context=self.context).data


class CandidatoSerializer(serializers.ModelSerializer):
    """Posición y reporte propuesto. Nunca la distancia ni un porcentaje (RN-02)."""

    reporte = ReportePublicoSerializer(source="propuesto", read_only=True)

    class Meta:
        model = Candidato
        fields = ["id", "posicion", "decision", "decidido_en", "reporte"]


class DecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=[Candidato.Decision.CONFIRMADO, Candidato.Decision.DESCARTADO])


class EventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoCaso
        fields = ["estado_anterior", "estado_nuevo", "nota", "en"]


class CasoSerializer(serializers.ModelSerializer):
    eventos = EventoSerializer(many=True, read_only=True)

    class Meta:
        model = Caso
        fields = ["estado", "reencuentro_confirmado_en", "cerrado_en", "eventos"]


class CambioEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Caso.Estado.choices)
    nota = serializers.CharField(max_length=200, required=False, allow_blank=True)
