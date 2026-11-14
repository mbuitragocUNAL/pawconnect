"""Servicio de reconocimiento de PawConnect (RF-03, RNF-10).

Recibe una foto, detecta al perro o al gato, lo recorta y devuelve el recorte
y su vector DINOv2. No guarda nada: la API decide qué se almacena (RN-04: solo
el recorte; la foto original se descarta aquí, en memoria).

    uv run uvicorn servicio:app --port 8001

POST /procesar   (multipart, campo «foto»)
  200 → {especie, confianza, modelo, dimension, vector[768], recorte_jpeg (base64)}
  422 → {"detail": {"codigo": "sin_animal", "mensaje": …}}  cuando no ve un animal
GET  /salud
"""

from __future__ import annotations

import base64
import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel

import pawmatch

MAX_BYTES = int(os.environ.get("RECONOCIMIENTO_MAX_BYTES", 10 * 1024 * 1024))  # 10 MB
MAX_LADO = 1600  # se reduce antes de detectar; basta para un recorte nítido

app = FastAPI(
    title="PawConnect · reconocimiento",
    version="0.1.0",
    description="Detecta y recorta al animal (OWL-ViT) y genera su vector de rasgos (DINOv2).",
)
_models: pawmatch.Models | None = None


def models() -> pawmatch.Models:
    global _models
    if _models is None:
        _models = pawmatch.Models()
    return _models


class Resultado(BaseModel):
    especie: str
    confianza: float
    modelo: str
    dimension: int
    vector: list[float]
    recorte_jpeg: str


@app.get("/salud")
def salud() -> dict:
    return {"estado": "ok", "modelo": pawmatch.EMBEDDER, "detector": pawmatch.DETECTOR, "cargado": _models is not None}


@app.post("/procesar", response_model=Resultado)
async def procesar(foto: UploadFile = File(...)) -> Resultado:
    data = await foto.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, {"codigo": "muy_grande", "mensaje": "La foto pesa más de 10 MB."})
    try:
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(415, {"codigo": "formato", "mensaje": "No pudimos abrir la foto. Usa JPG, PNG, WEBP o HEIC."})
    img.thumbnail((MAX_LADO, MAX_LADO))

    m = models()
    crop, especie, confianza = pawmatch.detect(m, img)
    if especie == "?":
        raise HTTPException(
            422,
            {
                "codigo": "sin_animal",
                "mensaje": "No vemos un perro o un gato en la foto. Tómala más de cerca o con más luz.",
            },
        )
    vec = pawmatch.embed(m, crop)

    buf = io.BytesIO()
    crop.save(buf, format="JPEG", quality=88)
    return Resultado(
        especie=especie,
        confianza=round(confianza, 4),
        modelo=pawmatch.EMBEDDER,
        dimension=int(vec.shape[0]),
        vector=[float(x) for x in vec],
        recorte_jpeg=base64.b64encode(buf.getvalue()).decode(),
    )
