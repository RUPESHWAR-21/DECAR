"""Download one Wikimedia Commons photo per supported model and cut out the background.

Usage (from the project root, in an environment with rembg + pillow installed):
    python tools/fetch_car_photos.py <download_dir>            # all models
    python tools/fetch_car_photos.py <download_dir> toyota-camry  # just one
    python tools/fetch_car_photos.py <download_dir> toyota-camry=File:Some_image.jpg  # pick a specific file

Writes transparent WebP cutouts to frontend/public/cars/<slug>.webp and photo credits
(author + licence, required by the CC licences) to frontend/src/carPhotos.json.
"""

import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend" / "public" / "cars"
MANIFEST = ROOT / "frontend" / "src" / "carPhotos.json"
UA = "OBD-Diagnostics-Dashboard/1.0 (local dev tool)"
WIDTH = 1600

# slug -> Wikipedia article whose lead image is used
ARTICLES = {
    "audi-a4": "Audi A4",
    "audi-q5": "Audi Q5",
    "bmw-3-series": "BMW 3 Series",
    "bmw-x3": "BMW X3",
    "chevrolet-equinox": "Chevrolet Equinox",
    "chevrolet-malibu": "Chevrolet Malibu",
    "chevrolet-silverado": "Chevrolet Silverado",
    "ford-escape": "Ford Escape",
    "ford-f-150": "Ford F-Series",
    "ford-focus": "Ford Focus",
    "honda-accord": "Honda Accord",
    "honda-cr-v": "Honda CR-V",
    "honda-civic": "Honda Civic",
    "hyundai-elantra": "Hyundai Elantra",
    "hyundai-tucson": "Hyundai Tucson",
    "kia-forte": "Kia Forte",
    "kia-sportage": "Kia Sportage",
    "mercedes-c-class": "Mercedes-Benz C-Class",
    "mercedes-glc": "Mercedes-Benz GLC",
    "nissan-altima": "Nissan Altima",
    "nissan-rogue": "Nissan Rogue",
    "subaru-forester": "Subaru Forester",
    "subaru-outback": "Subaru Outback",
    "tesla-model-3": "Tesla Model 3",
    "tesla-model-s": "Tesla Model S",
    "tesla-model-y": "Tesla Model Y",
    "toyota-camry": "Toyota Camry",
    "toyota-corolla": "Toyota Corolla",
    "toyota-rav4": "Toyota RAV4",
    "volkswagen-golf": "Volkswagen Golf",
    "volkswagen-passat": "Volkswagen Passat",
    "volkswagen-tiguan": "Volkswagen Tiguan",
}


def fetch(url: str, timeout: int = 60) -> bytes:
    """GET with a polite User-Agent, retrying when Wikimedia rate-limits us."""
    for attempt in range(6):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code != 429 or attempt == 5:
                raise
            time.sleep(int(exc.headers.get("Retry-After") or 0) or 5 * (attempt + 1))
    raise RuntimeError("unreachable")


def api(host: str, **params) -> dict:
    params.update(format="json", formatversion="2")
    return json.loads(fetch(f"https://{host}/w/api.php?{urllib.parse.urlencode(params)}", 30))


def lead_image(article: str) -> str:
    data = api("en.wikipedia.org", action="query", prop="pageimages", piprop="name",
               titles=article, redirects=1)
    page = data["query"]["pages"][0]
    if "pageimage" not in page:
        raise RuntimeError(f"No lead image for {article}")
    return "File:" + page["pageimage"]


def strip_tags(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def image_info(file_title: str) -> dict:
    data = api("commons.wikimedia.org", action="query", prop="imageinfo", titles=file_title,
               iiprop="url|extmetadata", iiurlwidth=str(WIDTH))
    info = data["query"]["pages"][0]["imageinfo"][0]
    meta = info.get("extmetadata", {})
    return {
        "file": file_title,
        "download": info.get("thumburl") or info["url"],
        "page": info["descriptionurl"],
        "author": strip_tags(meta.get("Artist", {}).get("value")) or "Unknown",
        "license": strip_tags(meta.get("LicenseShortName", {}).get("value")) or "See source",
    }


def download(url: str, dest: Path) -> Path:
    dest.write_bytes(fetch(url))
    return dest


def keep_largest_shape(cut: Image.Image) -> Image.Image:
    """Drop background scraps that are not connected to the main car shape."""
    import numpy as np
    from scipy import ndimage

    alpha = np.array(cut.getchannel("A"))
    # Opening first, so thin poles/wires touching the car are cut off before picking the largest shape.
    solid = ndimage.binary_opening(alpha > 24, structure=np.ones((11, 11)))
    labels, count = ndimage.label(solid, structure=np.ones((3, 3)))
    if count <= 1:
        return cut
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    keep = ndimage.binary_dilation(labels == int(np.argmax(sizes)), structure=np.ones((5, 5)))
    alpha[~keep] = 0
    cut.putalpha(Image.fromarray(alpha))
    return cut


def cutout(raw_path: Path, out_path: Path, session) -> None:
    from rembg import remove

    with Image.open(raw_path) as im:
        im = im.convert("RGB")
        cut = remove(im, session=session, post_process_mask=True)
    cut = keep_largest_shape(cut)
    bbox = cut.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    if bbox:
        pad = 12
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(cut.width, bbox[2] + pad), min(cut.height, bbox[3] + pad))
        cut = cut.crop(bbox)
    if cut.width > 1400:
        cut = cut.resize((1400, round(cut.height * 1400 / cut.width)), Image.LANCZOS)
    cut.save(out_path, "WEBP", quality=88, method=6)


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    raw_dir = Path(sys.argv[1])
    raw_dir.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    wanted = {}
    for arg in sys.argv[2:] or ARTICLES:
        slug, _, file_title = arg.partition("=")
        wanted[slug] = file_title or None

    from rembg import new_session
    session = new_session("isnet-general-use")

    manifest = json.loads(MANIFEST.read_text("utf-8")) if MANIFEST.exists() else {}
    for slug, file_title in wanted.items():
        try:
            file_title = file_title or lead_image(ARTICLES[slug])
            info = image_info(file_title)
            raw = download(info.pop("download"), raw_dir / f"{slug}.img")
            cutout(raw, OUT_DIR / f"{slug}.webp", session)
            manifest[slug] = info
            MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", "utf-8")
            print(f"ok   {slug:22} {file_title}")
        except Exception as exc:  # keep going; report at the end
            print(f"FAIL {slug:22} {exc}")
        time.sleep(2)


if __name__ == "__main__":
    main()
