from django.contrib import admin

from moderacion.models import Auditoria

from .models import Mensaje, SolicitudContacto


class MensajeInline(admin.TabularInline):
    model = Mensaje
    extra = 0
    readonly_fields = ["autor", "texto", "enviado_en"]
    can_delete = False


@admin.register(SolicitudContacto)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = ["id", "estado", "creada_en"]
    readonly_fields = ["candidato", "solicitante", "receptor", "acepto_solicitante_en", "acepto_receptor_en",
                       "rechazado_en", "mensaje_inicial"]
    inlines = [MensajeInline]

    def change_view(self, request, object_id, form_url="", extra_context=None):
        # RF-18: cada acceso de un administrador a mensajes queda registrado.
        obj = self.get_object(request, object_id)
        if obj:
            Auditoria.registrar(request.user, "ver_mensajes", obj)
        return super().change_view(request, object_id, form_url, extra_context)
