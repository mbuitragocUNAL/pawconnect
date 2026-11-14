# PawConnect

Perros y gatos perdidos y encontrados en Bogotá y la Sabana. Publicas la foto, PawConnect la compara con los reportes de la zona y te muestra cinco posibles coincidencias. Tú decides si es tu animal.

Proyecto de PawTeam. Este repositorio tiene todas las partes de la plataforma.

| Carpeta | Qué es |
|---|---|
| [`web/`](web/) | Interfaz web mobile-first en Next.js, con el sistema de diseño en código |
| [`api/`](api/) | API en Django REST Framework: cuentas, reportes, búsqueda, casos, contacto, organizaciones, adopción, guías y moderación |
| [`reconocimiento/`](reconocimiento/) | Servicio que recorta al animal y genera su vector (OWL-ViT + DINOv2), con el banco de pruebas |
| [`docs/`](docs/) | [Requisitos](docs/requisitos.md), [arquitectura](docs/arquitectura.md) y [lenguaje de diseño](docs/diseno/) |
| `compose.yaml` | Postgres con pgvector, almacenamiento S3 (MinIO), reconocimiento, API y web |

## Arrancar

Necesitas Docker, Node 22+ y [uv](https://docs.astral.sh/uv/).

Todo con Docker:

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- API y su documentación: http://localhost:8000/api/docs/
- Panel administrativo: http://localhost:8000/admin/
- Reconocimiento: http://localhost:8001/docs

La primera vez, el servicio de reconocimiento baja unos 0,9 GB de modelos.

Para desarrollar, lo más cómodo es correr en Docker solo la base de datos y el almacenamiento, y lo demás en tu máquina:

```bash
docker compose up -d db almacenamiento crear-bucket
```

```bash
cd api && uv sync && uv run python manage.py migrate && uv run python manage.py runserver
```

```bash
cd reconocimiento && uv sync && uv run uvicorn servicio:app --port 8001
```

```bash
cd web && npm install && npm run dev
```

Para crear un administrador:

```bash
cd api && uv run python manage.py createsuperuser
```

## Pruebas

```bash
cd api && uv run pytest
```

Necesitan la base de datos de `docker compose`. Cada prueba nombra la regla que protege (RF-15, RN-02, RN-05…).

## Estado

- **Módulo 1 (funcional este semestre):** en la API ya funcionan publicar, subir fotos con rechazo si no hay animal, buscar los 5 candidatos con pgvector, confirmar o descartar, la ficha del caso con historial y el contacto con dos llaves. Faltan las pantallas en `web/` conectadas a la API.
- **Módulos 2 a 4 (interfaz navegable):** modelos, admin y endpoints de lectura listos. Las pantallas están diseñadas en el [canvas](https://claude.ai/artifact/RcCaJKD7shuT9pbPqvFKYd).

Lo que falta está en [docs/arquitectura.md](docs/arquitectura.md#pendiente).

## Créditos

Las fotos de ejemplo son de Wikimedia Commons, cada una con su licencia: [`web/CREDITS.md`](web/CREDITS.md), [`docs/diseno/assets/img/`](docs/diseno/assets/img/) y [`reconocimiento/prueba-commons/FUENTES.md`](reconocimiento/prueba-commons/FUENTES.md).
