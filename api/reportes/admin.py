from django.contrib import admin

from .models import Candidato, Caso, EventoCaso, FotoRecorte, Reporte


class FotoInline(admin.TabularInline):
    model = FotoRecorte
    extra = 0
    fields = ["orden", "recorte", "especie_detectada", "confianza_detector", "modelo"]
    readonly_fields = fields


@admin.register(Reporte)
class ReporteAdmin(admin.ModelAdmin):
    """Moderación de reportes (RF-12): ocultar uno lo saca del listado y de la búsqueda."""

    list_display = ["__str__", "tipo", "especie", "zona_nombre", "fecha_evento", "oculto_por_moderacion", "creado_en"]
    list_filter = ["tipo", "especie", "oculto_por_moderacion"]
    search_fields = ["nombre", "zona_nombre", "rasgos"]
    exclude = ["lat_exacta", "lng_exacta"]  # ni el admin ve la coordenada exacta en el listado
    readonly_fields = ["lat_publica", "lng_publica", "autor"]
    inlines = [FotoInline]


class EventoInline(admin.TabularInline):
    model = EventoCaso
    extra = 0
    readonly_fields = ["estado_anterior", "estado_nuevo", "nota", "por", "en"]
    can_delete = False


@admin.register(Caso)
class CasoAdmin(admin.ModelAdmin):
    list_display = ["reporte", "estado", "reencuentro_confirmado_en", "cerrado_en"]
    list_filter = ["estado"]
    readonly_fields = ["reporte", "estado", "reencuentro_confirmado_en", "cerrado_en"]
    inlines = [EventoInline]


@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    list_display = ["consulta", "posicion", "propuesto", "decision"]
    list_filter = ["decision"]
