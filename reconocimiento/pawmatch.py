"""PawConnect — prototipo de reidentificación de mascotas.

Tres pasos, ningún entrenamiento:
  1. recortar al animal (OWL-ViT, detector por texto: «dog», «cat»);
  2. convertir el recorte en un vector (DINOv2, preentrenado);
  3. comparar vectores por similitud coseno contra las mascotas registradas.

Estructura de fotos esperada (ver README):

    fotos/<mascota>/registro/*.jpg     fotos que el dueño sube al reportar
    fotos/<mascota>/encontrada/*.jpg   fotos "de calle": lejos, de noche, otro ángulo

Comandos:
    pawmatch evaluar fotos/            recall@1/@5 + informe HTML
    pawmatch buscar fotos/ foto.jpg    top-5 para una foto suelta
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import html
import io
import json
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

try:  # fotos de iPhone
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:  # pragma: no cover
    pass

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
DETECTOR = "google/owlvit-base-patch32"  # Apache-2.0
EMBEDDERS = {
    "dinov2-base": "facebook/dinov2-base",  # Apache-2.0, sin registro
    # Licencia propia de Meta («DINOv3 License») y acceso aprobado en Hugging Face:
    "dinov3-small": "facebook/dinov3-vits16-pretrain-lvd1689m",
    "dinov3-base": "facebook/dinov3-vitb16-pretrain-lvd1689m",
}
EMBEDDER = EMBEDDERS["dinov2-base"]  # lo cambia --modelo
QUERIES = ["a photo of a dog", "a photo of a cat"]
SPECIES = ["perro", "gato"]
MIN_SCORE = 0.10  # por debajo, se usa la foto entera
PAD = 0.08  # margen alrededor de la caja detectada
CACHE_VERSION = 2  # súbelo si cambia el recorte o el modelo


# ---------------------------------------------------------------- modelos


def _device():
    import torch

    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


class Models:
    """Carga perezosa: el primer uso descarga los pesos (~0.9 GB en total)."""

    def __init__(self) -> None:
        self._det = None
        self._emb = None
        self.device = _device()

    def detector(self):
        if self._det is None:
            from transformers import OwlViTForObjectDetection, OwlViTProcessor

            proc = OwlViTProcessor.from_pretrained(DETECTOR)
            model = OwlViTForObjectDetection.from_pretrained(DETECTOR).to(self.device).eval()
            self._det = (proc, model)
        return self._det

    def embedder(self):
        if self._emb is None:
            from transformers import AutoImageProcessor, AutoModel

            proc = AutoImageProcessor.from_pretrained(EMBEDDER)
            model = AutoModel.from_pretrained(EMBEDDER).to(self.device).eval()
            self._emb = (proc, model)
        return self._emb


def load_image(path: Path) -> Image.Image:
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)  # respeta la rotación del celular
    return img.convert("RGB")


def detect(models: Models, img: Image.Image) -> tuple[Image.Image, str, float]:
    """Devuelve (recorte, especie, confianza). Si no ve un animal, la foto entera."""
    import torch

    proc, model = models.detector()
    inputs = proc(text=[QUERIES], images=img, return_tensors="pt").to(models.device)
    with torch.no_grad():
        out = model(**inputs)
    target = torch.tensor([img.size[::-1]], device=models.device)
    res = proc.post_process_grounded_object_detection(out, threshold=MIN_SCORE, target_sizes=target)[0]
    if len(res["scores"]) == 0:
        return img, "?", 0.0
    i = int(res["scores"].argmax())
    score = float(res["scores"][i])
    x0, y0, x1, y1 = res["boxes"][i].tolist()
    w, h = x1 - x0, y1 - y0
    W, H = img.size
    box = (
        max(0, int(x0 - PAD * w)),
        max(0, int(y0 - PAD * h)),
        min(W, int(x1 + PAD * w)),
        min(H, int(y1 + PAD * h)),
    )
    if box[2] - box[0] < 16 or box[3] - box[1] < 16:
        return img, "?", 0.0
    return img.crop(box), SPECIES[int(res["labels"][i])], score


def embed(models: Models, crop: Image.Image) -> np.ndarray:
    """Vector DINOv2 (CLS), promediado con su espejo y normalizado a norma 1."""
    import torch

    proc, model = models.embedder()
    batch = [crop, ImageOps.mirror(crop)]
    inputs = proc(images=batch, return_tensors="pt").to(models.device)
    with torch.no_grad():
        cls = model(**inputs).pooler_output  # (2, 768)
    v = cls.mean(0).float().cpu().numpy()
    return v / np.linalg.norm(v)


# ---------------------------------------------------------------- caché


@dataclass
class Photo:
    path: Path
    pet: str
    kind: str  # "registro" | "encontrada" | "consulta"
    vec: np.ndarray
    species: str
    score: float
    thumb: str  # data URI del recorte, para el informe


def _thumb(img: Image.Image, size: int = 220) -> str:
    t = img.copy()
    t.thumbnail((size, size))
    buf = io.BytesIO()
    t.save(buf, format="JPEG", quality=80)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


class Cache:
    """Guarda vector + recorte por hash del archivo: re-evaluar no recalcula nada."""

    def __init__(self, root: Path) -> None:
        self.dir = root / ".cache-pawmatch"
        self.dir.mkdir(exist_ok=True)

    def _key(self, path: Path) -> str:
        h = hashlib.sha1(path.read_bytes()).hexdigest()
        return f"{h}-v{CACHE_VERSION}-{EMBEDDER.split('/')[-1]}"

    def get(self, path: Path):
        f = self.dir / (self._key(path) + ".json")
        if not f.exists():
            return None
        d = json.loads(f.read_text())
        return np.array(d["vec"], dtype=np.float32), d["species"], d["score"], d["thumb"]

    def put(self, path: Path, vec, species, score, thumb) -> None:
        f = self.dir / (self._key(path) + ".json")
        f.write_text(json.dumps({"vec": vec.tolist(), "species": species, "score": score, "thumb": thumb}))


def process(models: Models, cache: Cache, path: Path, pet: str, kind: str) -> Photo:
    hit = cache.get(path)
    if hit is None:
        img = load_image(path)
        crop, species, score = detect(models, img)
        vec = embed(models, crop)
        thumb = _thumb(crop)
        cache.put(path, vec, species, score, thumb)
    else:
        vec, species, score, thumb = hit
    return Photo(path, pet, kind, vec, species, score, thumb)


def scan(root: Path) -> list[tuple[Path, str, str]]:
    items = []
    for pet_dir in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith(".")):
        for kind in ("registro", "encontrada"):
            d = pet_dir / kind
            if d.is_dir():
                for f in sorted(d.iterdir()):
                    if f.suffix.lower() in EXTS:
                        items.append((f, pet_dir.name, kind))
    return items


def load_all(root: Path) -> list[Photo]:
    items = scan(root)
    if not items:
        sys.exit(f"No hay fotos en {root}/<mascota>/registro|encontrada/. Ver README.")
    models, cache = Models(), Cache(root)
    photos = []
    for n, (f, pet, kind) in enumerate(items, 1):
        print(f"\r  procesando {n}/{len(items)}  {pet}/{kind}/{f.name[:30]:<30}", end="", file=sys.stderr)
        photos.append(process(models, cache, f, pet, kind))
    print(file=sys.stderr)
    return photos


# ---------------------------------------------------------------- búsqueda


def rank(query: Photo, gallery: list[Photo], same_species: bool = False) -> list[tuple[str, float, Photo]]:
    """Puntúa cada mascota por su foto de registro más parecida a la consulta.

    Se usa el máximo, no el promedio: la foto de calle suele coincidir con UNA de
    las del dueño (el mismo lado, el mismo ángulo), no con todas.

    El filtro de especie viene apagado: el detector confunde perro y gato en
    alguna foto, y eso esconde a la mascota correcta. En la app la especie la
    declaran el dueño y quien la encontró, no el detector.
    """
    best: dict[str, tuple[float, Photo]] = {}
    for g in gallery:
        if same_species and "?" not in (query.species, g.species) and g.species != query.species:
            continue
        s = float(query.vec @ g.vec)
        if g.pet not in best or s > best[g.pet][0]:
            best[g.pet] = (s, g)
    return sorted(((pet, s, g) for pet, (s, g) in best.items()), key=lambda t: -t[1])


# ---------------------------------------------------------------- informe


CSS = """
:root{--bg:#fafaf8;--fg:#1d1d1b;--mut:#6b6b66;--ok:#1f7a44;--bad:#b3261e;--line:#e4e3de;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--fg:#ecebe6;--mut:#9a9992;--ok:#5cc489;--bad:#f2867e;--line:#2c2c2a;--card:#1f1f1d}}
*{box-sizing:border-box}body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
main{max-width:1180px;margin:0 auto}h1{font-size:22px;margin:0 0 4px}p.mut{color:var(--mut);margin:0 0 20px}
.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px}.kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 16px;min-width:130px}
.kpi b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.kpi span{color:var(--mut);font-size:13px}
.row{display:grid;grid-template-columns:150px 1fr;gap:16px;padding:14px 0;border-top:1px solid var(--line)}
.cands{display:flex;gap:10px;overflow-x:auto}figure{margin:0;width:130px;flex:none}
figure img{width:130px;height:130px;object-fit:cover;border-radius:8px;display:block;border:3px solid transparent}
figure.hit img{border-color:var(--ok)}figcaption{font-size:12px;color:var(--mut);margin-top:4px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
figure.hit figcaption{color:var(--ok);font-weight:600}.q figcaption{color:var(--fg)}.miss{color:var(--bad);font-weight:600}
@media (max-width:560px){.row{grid-template-columns:1fr}}
"""


def _fig(img: str, cap: str, cls: str = "") -> str:
    return f'<figure class="{cls}"><img src="{img}" alt=""><figcaption>{html.escape(cap)}</figcaption></figure>'


def report(rows, metrics: dict, out: Path, title: str) -> None:
    parts = [f"<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
             f"<title>{html.escape(title)}</title><style>{CSS}</style><main><h1>{html.escape(title)}</h1>"
             f"<p class=mut>Cada fila es una foto «encontrada». A la derecha, las 5 mascotas registradas más parecidas; "
             f"en verde, la correcta. Detector {DETECTOR} · vectores {EMBEDDER}.</p><div class=kpis>"]
    for k, v in metrics.items():
        parts.append(f"<div class=kpi><b>{v}</b><span>{html.escape(k)}</span></div>")
    parts.append("</div>")
    for q, ranked, pos in rows:
        label = f"{q.pet} · {q.path.name}"
        verdict = f"puesto {pos}" if pos else "<span class=miss>no está en el top-5</span>"
        parts.append(f"<div class=row><div class=q>{_fig(q.thumb, label, 'q')}<div class=mut style='font-size:12px'>"
                     f"{q.species} ({q.score:.2f}) · {verdict}</div></div><div class=cands>")
        for pet, s, g in ranked[:5]:
            parts.append(_fig(g.thumb, f"{pet} · {s:.3f}", "hit" if pet == q.pet else ""))
        parts.append("</div></div>")
    out.write_text("".join(parts) + "</main>", encoding="utf-8")


# ---------------------------------------------------------------- comandos


def cmd_evaluar(args) -> None:
    root = Path(args.fotos)
    photos = load_all(root)
    gallery = [p for p in photos if p.kind == "registro"]
    queries = [p for p in photos if p.kind == "encontrada"]
    pets = sorted({p.pet for p in gallery})
    if len(pets) < 2 or not queries:
        sys.exit("Hacen falta al menos 2 mascotas con fotos de registro y alguna foto «encontrada».")

    rows, hits1, hits5, rr = [], 0, 0, 0.0
    for q in queries:
        ranked = rank(q, gallery, same_species=args.filtro_especie)
        order = [pet for pet, _, _ in ranked]
        pos = order.index(q.pet) + 1 if q.pet in order else None
        hits1 += pos == 1
        hits5 += bool(pos and pos <= 5)
        rr += 1 / pos if pos else 0
        rows.append((q, ranked, pos if pos and pos <= 5 else None))

    n = len(queries)
    no_det = sum(p.species == "?" for p in photos)
    metrics = {
        "mascotas registradas": len(pets),
        "fotos de consulta": n,
        "recall@1": f"{hits1 / n:.0%}",
        "recall@5": f"{hits5 / n:.0%}",
        "MRR": f"{rr / n:.2f}",
        "azar @5": f"{min(5, len(pets)) / len(pets):.0%}",
        "sin animal detectado": no_det,
    }
    print("\n".join(f"  {k:<22} {v}" for k, v in metrics.items()))
    out = Path(args.salida or root / f"informe-{args.modelo}.html")
    report(sorted(rows, key=lambda r: (r[2] or 99)), metrics, out, "PawConnect · evaluación de reconocimiento")
    print(f"\n  informe: {out}")


def cmd_buscar(args) -> None:
    root = Path(args.fotos)
    gallery = [p for p in load_all(root) if p.kind == "registro"]
    q = process(Models(), Cache(root), Path(args.foto), "?", "consulta")
    ranked = rank(q, gallery, same_species=args.filtro_especie)
    print(f"  detectado: {q.species} ({q.score:.2f})")
    for i, (pet, s, g) in enumerate(ranked[:5], 1):
        print(f"  {i}. {pet:<20} {s:.3f}   ({g.path.name})")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(prog="pawmatch", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--modelo", choices=EMBEDDERS, default="dinov2-base", help="modelo de vectores (por defecto dinov2-base)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("evaluar", help="recall@k sobre fotos/<mascota>/{registro,encontrada}")
    e.add_argument("fotos")
    e.add_argument("--salida", help="ruta del informe HTML (por defecto fotos/informe-<modelo>.html)")
    e.add_argument("--filtro-especie", action="store_true", help="descartar candidatos de otra especie según el detector")
    e.set_defaults(fn=cmd_evaluar)
    b = sub.add_parser("buscar", help="top-5 mascotas para una foto")
    b.add_argument("fotos")
    b.add_argument("foto")
    b.add_argument("--filtro-especie", action="store_true")
    b.set_defaults(fn=cmd_buscar)
    args = ap.parse_args(argv)
    global EMBEDDER
    EMBEDDER = EMBEDDERS[args.modelo]
    args.fn(args)


if __name__ == "__main__":
    main()
