"""PawConnect API: configuración.

Todo lo que cambia entre máquinas sale de variables de entorno (ver
`../.env.example`). Sin variables, arranca en modo desarrollo contra el
Postgres + pgvector de `docker compose`.
"""

import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def env(name: str, default: str | None = None) -> str | None:
    return os.environ.get(name, default)


def env_bool(name: str, default: bool = False) -> bool:
    return env(name, str(default)).lower() in {"1", "true", "yes", "si", "sí"}


def env_list(name: str, default: str = "") -> list[str]:
    return [x.strip() for x in env(name, default).split(",") if x.strip()]


DEBUG = env_bool("DJANGO_DEBUG", True)
SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-solo-local-no-usar-en-produccion" if DEBUG else None)
if not SECRET_KEY:
    raise RuntimeError("Falta DJANGO_SECRET_KEY")

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,api")
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS", "http://localhost:3000")
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:3000")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "rest_framework",
    "rest_framework.authtoken",
    "drf_spectacular",
    "corsheaders",
    "cuentas",
    "reportes",
    "contacto",
    "organizaciones",
    "contenidos",
    "moderacion",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": dj_database_url.parse(
        env("DATABASE_URL", "postgres://pawconnect:pawconnect@localhost:5432/pawconnect"),
        conn_max_age=60,
    )
}

AUTH_USER_MODEL = "cuentas.Usuario"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Almacenamiento de recortes: S3 compatible (MinIO en desarrollo) si hay bucket;
# si no, disco local. Los recortes nunca son públicos: se sirven con URL firmada
# y con vencimiento (RNF-06: fotos sin enlaces listables).
S3_BUCKET = env("S3_BUCKET")
STORAGES = {
    "default": (
        {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {
                "bucket_name": S3_BUCKET,
                "endpoint_url": env("S3_ENDPOINT_URL"),
                "access_key": env("S3_ACCESS_KEY"),
                "secret_key": env("S3_SECRET_KEY"),
                "region_name": env("S3_REGION", "us-east-1"),
                "querystring_auth": True,
                "querystring_expire": 3600,
                "default_acl": None,
                "file_overwrite": False,
                "custom_domain": None,
                "url_protocol": env("S3_URL_PROTOCOL", "http:"),
            },
        }
        if S3_BUCKET
        else {"BACKEND": "django.core.files.storage.FileSystemStorage"}
    ),
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticatedOrReadOnly"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 24,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "PawConnect API",
    "DESCRIPTION": "API de PawConnect: reportes de perros y gatos perdidos y encontrados, búsqueda por foto, "
    "casos, contacto intermediado, organizaciones verificadas, adopción y guías.",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# Reglas de negocio configurables (sección 3 del documento de requisitos)
PAWCONNECT = {
    "RECONOCIMIENTO_URL": env("RECONOCIMIENTO_URL", "http://localhost:8001"),
    "RECONOCIMIENTO_TIMEOUT_S": float(env("RECONOCIMIENTO_TIMEOUT_S", "20")),
    "VECTOR_DIM": 768,  # DINOv2-base
    "RADIO_ZONA_M": 500,  # RF-15: círculo público
    "RADIO_BUSQUEDA_KM": float(env("RADIO_BUSQUEDA_KM", "15")),  # RF-19
    "VENTANA_BUSQUEDA_DIAS": int(env("VENTANA_BUSQUEDA_DIAS", "60")),  # RF-19
    "CANDIDATOS": 5,  # RF-04
    "MAX_FOTOS_POR_REPORTE": 5,  # RF-02
    "MAX_REPORTES_POR_DIA": int(env("MAX_REPORTES_POR_DIA", "5")),  # RF-17 (valor del plan de pruebas)
    "VIGENCIA_AVISTAMIENTO_DIAS": 7,  # propuesta «Visto en la calle»
    "CODIGO_SMS_MINUTOS": 5,
    "CODIGO_SMS_INTENTOS": 5,
}

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SSL_REDIRECT", True)  # RNF-06: HTTPS en todo el tráfico
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
