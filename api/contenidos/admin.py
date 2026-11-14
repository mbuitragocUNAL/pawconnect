from django.contrib import admin

from .models import GuiaTramite


@admin.register(GuiaTramite)
class GuiaAdmin(admin.ModelAdmin):
    list_display = ["titulo", "categoria", "fuente_nombre", "actualizado_en", "publicada"]
    list_filter = ["categoria", "publicada"]
    prepopulated_fields = {"slug": ["titulo"]}
