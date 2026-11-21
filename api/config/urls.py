from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from contacto.views import SolicitudViewSet
from contenidos.views import GuiaViewSet
from cuentas import views as cuentas
from moderacion.views import ReportePerfilViewSet
from organizaciones.views import AnimalViewSet, OrganizacionViewSet
from reportes.views import CandidatoViewSet, ReporteViewSet
from reportes.views import foto_contenido

router = DefaultRouter()
router.register("reportes", ReporteViewSet, basename="reporte")
router.register("candidatos", CandidatoViewSet, basename="candidato")
router.register("contacto", SolicitudViewSet, basename="contacto")
router.register("alertas", cuentas.AlertaViewSet, basename="alerta")
router.register("organizaciones", OrganizacionViewSet, basename="organizacion")
router.register("adopcion", AnimalViewSet, basename="adopcion")
router.register("guias", GuiaViewSet, basename="guia")
router.register("moderacion/perfiles", ReportePerfilViewSet, basename="reporte-perfil")

admin.site.site_header = "PawConnect · administración"
admin.site.site_title = "PawConnect"

urlpatterns = [
    path("admin/", admin.site.urls),  # RF-12: panel de verificación y moderación
    path("api/salud/", lambda r: JsonResponse({"estado": "ok"})),
    path("api/cuentas/codigo/", cuentas.pedir_codigo),
    path("api/cuentas/verificar/", cuentas.verificar_codigo),
    path("api/cuentas/yo/", cuentas.yo),
    path("api/reportes/<uuid:reporte_id>/fotos/<int:foto_id>/contenido/", foto_contenido),
    path("api/", include(router.urls)),
    path("api/esquema/", SpectacularAPIView.as_view(), name="esquema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="esquema"), name="docs"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
