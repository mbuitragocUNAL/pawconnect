from django.contrib import admin

from .models import Auditoria, ReportePerfil


@admin.register(ReportePerfil)
class ReportePerfilAdmin(admin.ModelAdmin):
    list_display = ["id", "organizacion", "usuario_reportado", "estado", "creado_en"]
    list_filter = ["estado"]


@admin.register(Auditoria)
class AuditoriaAdmin(admin.ModelAdmin):
    """Solo lectura: la auditoría no se edita ni se borra."""

    list_display = ["en", "administrador", "accion", "objeto_tipo", "objeto_id", "detalle"]
    list_filter = ["accion", "objeto_tipo"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
