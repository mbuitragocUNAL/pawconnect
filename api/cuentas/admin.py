from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Consentimiento, SuscripcionAlerta, Usuario


class ConsentimientoInline(admin.TabularInline):
    model = Consentimiento
    extra = 0
    readonly_fields = ["tipo", "version_texto", "aceptado_en", "retirado_en"]
    can_delete = False


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ["id", "nombre_publico", "rol", "nivel_verificacion", "is_active", "eliminacion_solicitada_en"]
    list_filter = ["rol", "nivel_verificacion", "is_active"]
    search_fields = ["nombre_publico", "celular"]
    inlines = [ConsentimientoInline]
    fieldsets = UserAdmin.fieldsets + (
        ("PawConnect", {"fields": ["celular", "celular_verificado_en", "nombre_publico", "rol", "nivel_verificacion",
                                   "zona_principal", "eliminacion_solicitada_en"]}),
    )


admin.site.register(SuscripcionAlerta)
