from django.contrib import admin, messages
from django.utils import timezone

from moderacion.models import Auditoria

from .models import AnimalAdopcion, Organizacion


@admin.register(Organizacion)
class OrganizacionAdmin(admin.ModelAdmin):
    """Cola de verificación (RF-12, RF-14). Aprobar y retirar el sello queda en la auditoría."""

    list_display = ["nombre", "tipo", "sello", "verificado_en", "zona_nombre"]
    list_filter = ["tipo", "sello", "urgencias_24h"]
    search_fields = ["nombre", "zona_nombre"]
    readonly_fields = ["sello", "verificado_en"]
    actions = ["aprobar_sello", "retirar_sello"]

    def _sello(self, request, queryset, sello, accion):
        for org in queryset:
            org.sello = sello
            org.verificado_en = timezone.now()
            org.save(update_fields=["sello", "verificado_en"])
            Auditoria.registrar(request.user, accion, org)
        messages.success(request, f"{queryset.count()} organización(es) actualizadas.")

    @admin.action(description="Aprobar sello")
    def aprobar_sello(self, request, queryset):
        self._sello(request, queryset, Organizacion.Sello.APROBADO, "aprobar_sello")

    @admin.action(description="Retirar sello")
    def retirar_sello(self, request, queryset):
        self._sello(request, queryset, Organizacion.Sello.RETIRADO, "retirar_sello")


@admin.register(AnimalAdopcion)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ["nombre", "especie", "organizacion", "estado", "publicado_en"]
    list_filter = ["especie", "estado"]
