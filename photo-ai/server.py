"""Santa Madre: private GPU-backed photo try-on API (FASHN VTON v1.5).

Run only on a trusted server. Images are decoded and held in RAM and are not saved.
The service deliberately does not enable CORS for arbitrary origins.
"""
import io
import os
from functools import lru_cache
from pathlib import Path
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_DIM = 2048
GARMENTS = {"escritor", "advogado", "medico", "empresario"}
ROOT = Path(__file__).resolve().parent
app = FastAPI(title="Santa Madre - Prova Virtual")

@lru_cache(maxsize=1)
def get_pipeline():
    from fashn_vton import TryOnPipeline
    weights = os.environ.get("VTON_WEIGHTS_DIR", "/opt/fashn-vton-1.5/weights")
    return TryOnPipeline(weights_dir=weights)

def load_image(data: bytes) -> Image.Image:
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Imagem muito grande (limite 8 MB)")
    try:
        image = Image.open(io.BytesIO(data))
        image.load()
        if max(image.size) > MAX_DIM:
            image.thumbnail((MAX_DIM, MAX_DIM))
        return image.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(400, "Formato de imagem inválido")

@app.get("/health")
def health():
    return {"status": "ok", "model": "FASHN VTON v1.5", "garments": sorted(GARMENTS)}

@app.post("/tryon")
async def tryon(
    photo: UploadFile = File(...),
    profession: str = Form(...),
    x_api_key: str | None = Header(default=None),
):
    token = os.environ.get("SANTA_MADRE_API_KEY")
    if not token:
        raise HTTPException(503, "Configure SANTA_MADRE_API_KEY no servidor")
    if x_api_key != token:
        raise HTTPException(401, "Acesso não autorizado")
    if profession not in GARMENTS:
        raise HTTPException(400, "Profissão desconhecida")
    if photo.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(415, "Use JPEG, PNG ou WebP")

    person = load_image(await photo.read(MAX_IMAGE_BYTES + 1))
    garment_path = ROOT / "garments" / (profession + ".png")
    if not garment_path.is_file():
        raise HTTPException(503, "Imagem de uniforme não preparada: " + profession)

    garment = Image.open(garment_path).convert("RGB")
    import asyncio
    def infer():
        pipeline = get_pipeline()
        return pipeline(
            person_image=person, garment_image=garment, category="tops",
        ).images[0]
    try:
        result = await asyncio.to_thread(infer)
    except Exception as exc:
        raise HTTPException(503, "Falha ao gerar prova virtual") from exc
    output = io.BytesIO()
    result.save(output, format="PNG")
    output.seek(0)
    return Response(content=output.getvalue(), media_type="image/png",
                    headers={"Cache-Control": "no-store", "Pragma": "no-cache"})
