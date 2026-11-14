from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import mixins, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .models import Candidato, Caso, Reporte
from .serializers import (
    CambioEstadoSerializer,
    CandidatoSerializer,
    CasoSerializer,
    DecisionSerializer,
    FotoSerializer,
    ReporteCrearSerializer,
    ReportePublicoSerializer,
)
from .servicios import FotoRechazada, ReconocimientoNoDisponible, buscar_candidatos, procesar_foto


class ReporteViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """Reportes de perros y gatos perdidos, encontrados y vistos en la calle.

    El listado es público y muestra solo el área de 500 m (RF-15).
    Filtros: `tipo`, `especie`, `zona` (texto).
    """

    queryset = Reporte.objects.select_related("caso").prefetch_related("fotos")

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            qs = qs.filter(oculto_por_moderacion=False, caso__estado__in=["activo", "seguimiento"]).exclude(
                Q(tipo=Reporte.Tipo.VISTO) & Q(vence_en__lt=timezone.now())
            )
            p = self.request.query_params
            if p.get("tipo"):
                qs = qs.filter(tipo=p["tipo"])
            if p.get("especie"):
                qs = qs.filter(especie=p["especie"])
            if p.get("zona"):
                qs = qs.filter(zona_nombre__icontains=p["zona"])
        return qs

    def get_serializer_class(self):
        return ReporteCrearSerializer if self.action == "create" else ReportePublicoSerializer

    def _mio(self, pk) -> Reporte:
        reporte = get_object_or_404(Reporte, pk=pk)
        if reporte.autor_id != self.request.user.id:
            raise PermissionDenied("Solo quien publicó el reporte puede hacer esto.")
        return reporte

    @extend_schema(
        request={"multipart/form-data": inline_serializer("SubirFoto", {"foto": serializers.ImageField()})},
        responses={201: FotoSerializer},
    )
    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser], permission_classes=[permissions.IsAuthenticated])
    def fotos(self, request, pk=None):
        """Sube una foto (1 a 5 por reporte). Se guarda solo el recorte (RN-04); sin animal, 422 (RF-03)."""
        reporte = self._mio(pk)
        archivo = request.FILES.get("foto")
        if not archivo:
            return Response({"codigo": "sin_foto", "detail": "Falta la foto."}, status=400)
        try:
            foto = procesar_foto(reporte, archivo)
        except FotoRechazada as e:
            return Response({"codigo": e.codigo, "detail": e.mensaje}, status=e.status)
        except ReconocimientoNoDisponible:
            return Response(
                {"codigo": "reconocimiento_no_disponible", "detail": "No pudimos procesar la foto. Intenta en un momento."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(FotoSerializer(foto, context={"request": request}).data, status=201)

    @extend_schema(responses=CandidatoSerializer(many=True))
    @action(detail=True, methods=["get", "post"], permission_classes=[permissions.IsAuthenticated])
    def candidatos(self, request, pk=None):
        """GET: candidatos actuales. POST: vuelve a buscar (RF-04, RF-19). Siempre en orden, sin porcentajes."""
        reporte = self._mio(pk)
        if request.method == "POST":
            buscar_candidatos(reporte)
        qs = reporte.candidatos.exclude(decision=Candidato.Decision.DESCARTADO).select_related("propuesto__caso")
        return Response(CandidatoSerializer(qs, many=True, context={"request": request}).data)

    @extend_schema(methods=["GET"], responses=CasoSerializer)
    @extend_schema(methods=["POST"], request=CambioEstadoSerializer, responses=CasoSerializer)
    @action(detail=True, methods=["get", "post"], permission_classes=[permissions.IsAuthenticated])
    def caso(self, request, pk=None):
        """Ficha del caso con su historial (RF-06). POST cambia el estado; lo hace siempre una persona (RN-01)."""
        reporte = self._mio(pk)
        caso = reporte.caso
        if request.method == "POST":
            s = CambioEstadoSerializer(data=request.data)
            s.is_valid(raise_exception=True)
            caso.cambiar_estado(s.validated_data["estado"], por=request.user, nota=s.validated_data.get("nota", ""))
        return Response(CasoSerializer(caso).data)


class CandidatoViewSet(viewsets.GenericViewSet):
    queryset = Candidato.objects.select_related("consulta__caso", "propuesto")
    serializer_class = CandidatoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=DecisionSerializer, responses=CandidatoSerializer)
    @action(detail=True, methods=["post"])
    def decision(self, request, pk=None):
        """Confirmar o descartar (RF-05). Descartado desaparece de la lista (HU-05).

        Confirmar no resuelve el caso: lo pasa a «en seguimiento». El reencuentro lo marca
        la persona después, desde la ficha del caso (RN-01).
        """
        candidato = self.get_object()
        if candidato.consulta.autor_id != request.user.id:
            raise PermissionDenied("Solo quien publicó el reporte decide sobre sus candidatos.")
        s = DecisionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        candidato.decision = s.validated_data["decision"]
        candidato.decidido_en = timezone.now()
        candidato.save(update_fields=["decision", "decidido_en"])
        caso = candidato.consulta.caso
        if candidato.decision == Candidato.Decision.CONFIRMADO and caso.estado == Caso.Estado.ACTIVO:
            caso.cambiar_estado(Caso.Estado.SEGUIMIENTO, por=request.user, nota=f"Confirmaste el candidato {candidato.posicion:02d}")
        return Response(CandidatoSerializer(candidato, context={"request": request}).data)
