# PawConnect · API

Django 6 + Django REST Framework sobre PostgreSQL con pgvector.

```bash
docker compose up -d db          # desde la raíz del repositorio
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

- Documentación interactiva: http://localhost:8000/api/docs/ (esquema OpenAPI en `/api/esquema/`)
- Panel administrativo: http://localhost:8000/admin/ (`uv run python manage.py createsuperuser`)
- Pruebas: `uv run pytest`

Las variables de entorno están en [`../.env.example`](../.env.example). Sin ellas, la API usa el Postgres de `docker compose`, guarda los recortes en disco (`media/`) y busca el servicio de reconocimiento en `localhost:8001`.

## Apps

| App | Modelos (sección 7.1) | Endpoints |
|---|---|---|
| `cuentas` | `Usuario`, `Consentimiento`, `CodigoVerificacion`, `SuscripcionAlerta` | `cuentas/codigo/`, `cuentas/verificar/`, `cuentas/yo/`, `alertas/` |
| `reportes` | `Reporte`, `FotoRecorte` (vector de 768 con índice HNSW), `Caso`, `EventoCaso`, `Candidato` | `reportes/`, `reportes/{id}/fotos/`, `reportes/{id}/candidatos/`, `reportes/{id}/caso/`, `candidatos/{id}/decision/` |
| `contacto` | `SolicitudContacto`, `Mensaje` | `contacto/`, `contacto/{id}/aceptar/`, `rechazar/`, `mensajes/` |
| `organizaciones` | `Organizacion`, `AnimalAdopcion` | `organizaciones/`, `adopcion/` |
| `contenidos` | `GuiaTramite` | `guias/` |
| `moderacion` | `ReportePerfil`, `Auditoria` | `moderacion/perfiles/` |

Las reglas configurables (radio de búsqueda, ventana de días, límite diario, vigencia de un avistamiento) están en `PAWCONNECT` dentro de `config/settings.py`. Las decisiones de diseño están en [`../docs/arquitectura.md`](../docs/arquitectura.md).

## Sesión

1. `POST /api/cuentas/codigo/` con `{"celular": "+573001234567"}`. En desarrollo, el código aparece en el log del servidor.
2. `POST /api/cuentas/verificar/` con el código. Si la cuenta es nueva, también hace falta `"acepta_tratamiento": true` (casilla sin marcar por defecto).
3. Responde un `token`. Las demás llamadas lo mandan como `Authorization: Token <token>`.
