# Arquitectura

Seis componentes, como en la sección 7 de los [requisitos](requisitos.md). La interfaz solo habla con la API. La API es la única que escribe en la base de datos y en el almacenamiento.

```
            ┌──────────────┐   HTTPS/JSON    ┌──────────────────────┐  foto   ┌──────────────────────┐
 persona ──▶│ web          │ ──────────────▶ │ api                  │ ──────▶ │ reconocimiento       │
            │ Next.js      │                 │ Django REST          │ ◀────── │ OWL-ViT + DINOv2     │
            └──────────────┘                 │                      │ recorte │ (no guarda nada)     │
                                             │                      │ + vector└──────────────────────┘
                                             │                      │
                                             │   ┌──────────────────┴─┐   ┌──────────────────────────┐
                                             └──▶│ PostgreSQL         │   │ almacenamiento (S3)      │
                                                 │ + pgvector         │   │ solo recortes, URL       │
                                                 │ datos y vectores   │   │ firmada con vencimiento  │
                                                 └────────────────────┘   └──────────────────────────┘
```

| Carpeta | Componente | Tecnología | Estado |
|---|---|---|---|
| `web/` | Interfaz | Next.js 16, React 19, Tailwind 4, shadcn/ui sobre Base UI | Sistema de diseño, inicio y vitrina `/sistema`. Las demás pantallas siguen en el canvas |
| `api/` | API | Django 6, Django REST Framework, drf-spectacular | Modelos de la sección 7.1 y Módulo 1 con pruebas. Los módulos 2 a 4 tienen modelos y lectura |
| `reconocimiento/` | Servicio de reconocimiento | FastAPI, PyTorch, Transformers | Funciona. Es el prototipo `pawmatch` con una capa HTTP |
| `compose.yaml` → `db` | Base de datos con vectores | PostgreSQL 17 + pgvector, índice HNSW coseno | Funciona |
| `compose.yaml` → `almacenamiento` | Almacenamiento de imágenes | MinIO en desarrollo (S3 compatible) | Funciona en compose |
| — | Mapas | MapLibre u OpenStreetMap | Pendiente. `ZoneMap` es la ilustración; `zonePaint` y `ZONE_RADIUS_M` son las reglas que el mapa real debe usar |
| — | SMS | Proveedor por confirmar | Pendiente. En desarrollo el código sale en el log de la API |

## Decisiones

**1. El servicio de reconocimiento no toca la base de datos.** La sección 7 dice que el servicio «guarda el vector en la base de datos y el recorte en el almacenamiento». Aquí devuelve recorte y vector, y la API los guarda. Así hay un solo dueño de los datos, el servicio no necesita credenciales y se puede mover a una máquina con GPU sin tocar nada más. Cumple RNF-10 (servicio separado).

**2. OWL-ViT + DINOv2, no YOLO + CLIP.** La sección 7 los nombra como ejemplo («p. ej. YOLO», «CLIP o DINOv2»). El prototipo midió OWL-ViT para recortar y DINOv2-base para el vector: 30 de 30 fotos del equipo en el puesto 1, y DINOv2 separa los gatos parecidos de 5 a 20 veces mejor que DINOv3 (ver [`reconocimiento/README.md`](../reconocimiento/README.md)). Los dos tienen licencia Apache-2.0.

**3. La especie la declara la persona.** El detector se equivoca de especie a veces, así que la búsqueda filtra por la especie del reporte, no por la detectada. La detectada se guarda solo como dato.

**4. Ubicación.** El reporte guarda la coordenada exacta (privada) y un centro público desplazado al azar dentro de 500 m. La API pública solo entrega el centro público y `radio_m: 500` (RF-15, RNF-03). Los filtros de distancia (RF-19) se calculan en el servidor con la coordenada exacta. Por ahora no se usa PostGIS: basta un rectángulo en SQL y la distancia exacta en Python. Si los reportes crecen a decenas de miles, conviene PostGIS.

**5. Búsqueda.** Primero los filtros (RN-03, RF-19): misma especie, tipo opuesto, ±60 días, 15 km, caso abierto, sin avistamientos vencidos y sin reportes propios. Luego la distancia coseno en pgvector, y cada reporte se puntúa con su foto más parecida. Se guardan los 5 primeros como `Candidato`. La distancia queda en la base de datos y **nunca** sale por la API (RN-02); el cliente solo recibe `posicion`.

**6. Nadie más que una persona cierra un caso (RN-01).** `Caso.cambiar_estado` exige quién lo hace. Confirmar un candidato pasa el caso a «en seguimiento»; «resuelto» solo lo marca la persona desde la ficha del caso.

**7. Las dos llaves (RN-05).** `SolicitudContacto.telefono_de()` devuelve el número enmascarado hasta que las dos partes aceptan. Ninguna respuesta de la API lleva el número completo antes de eso (RF-07).

**8. Tipo de reporte «visto».** Es la propuesta de la sección 6 de [`diseno/01-captura-figma-y-requisitos.md`](diseno/01-captura-figma-y-requisitos.md). Ya está en el modelo y en la búsqueda: una pérdida se compara con hallazgos y avistamientos, y un avistamiento vence a los 7 días. Si el equipo no la aprueba, se quita `Tipo.VISTO`.

**9. Panel administrativo.** Es el admin de Django (RF-12), como prevé la sección 7. Aprobar o retirar un sello y abrir los mensajes de una solicitud de contacto quedan en `Auditoria` (RF-18), que es de solo lectura.

## Del requisito al código

| Requisito | Dónde |
|---|---|
| RF-01, RN-09 | `api/cuentas`: `CodigoVerificacion`, `POST /api/cuentas/codigo/`, `/verificar/` |
| RF-02, RF-17 | `ReporteCrearSerializer`: campos, autorización de ubicación, límite diario |
| RF-03, RN-04 | `reportes/servicios.py: procesar_foto` + `reconocimiento/servicio.py` |
| RF-04, RF-19, RN-02, RN-03 | `reportes/servicios.py: buscar_candidatos`, `POST /api/reportes/{id}/candidatos/` |
| RF-05, HU-05 | `POST /api/candidatos/{id}/decision/` |
| RF-06, RN-01 | `Caso`, `EventoCaso`, `GET/POST /api/reportes/{id}/caso/` |
| RF-07, RN-05 | `api/contacto`: `/api/contacto/`, `aceptar`, `rechazar`, `mensajes` |
| RF-08 | `POST /api/adopcion/`: solo una fundación con sello aprobado |
| RF-09 | `GET /api/guias/` |
| RF-10, RF-14 | `GET /api/organizaciones/?categoria=&urgencias=1` |
| RF-11 | `/api/alertas/`. El envío de avisos está pendiente |
| RF-12, RF-18 | `/admin/` + `moderacion.Auditoria` |
| RF-13, RNF-05 | `Consentimiento`; `DELETE /api/cuentas/yo/`. El borrado programado está pendiente |
| RF-15, RNF-03 | `Reporte.lat_publica/lng_publica`, `ZonaSerializer` |
| RF-16 | `POST /api/moderacion/perfiles/` |

Cada regla que tiene prueba la nombra en `api/tests/test_modulo1.py`.

## Pendiente

- Conectar `web/` a la API (hoy usa datos de ejemplo en `web/src/lib/sample.ts`).
- Mapa real con MapLibre.
- Proveedor de SMS.
- Avisos por zona (RF-11): una tarea que, al publicar un reporte, busque `SuscripcionAlerta` activas dentro del radio.
- Tareas programadas: borrado de cuenta en ≤ 15 días hábiles (RNF-05), borrado de coordenada exacta 30 días después de cerrar y de recorte y vector a los 12 meses (RN-08), vencimiento de avistamientos.
- Producción: gunicorn, HTTPS (RNF-06), una imagen de PyTorch solo CPU para `reconocimiento`.
