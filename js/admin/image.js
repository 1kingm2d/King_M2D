/* Browser-side image compression: resize + WebP (JPEG fallback). Animated GIFs become still images. */
function loadImage(file) {
  return new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Could not read that image.")); };
    img.src = url;
  });
}

function toBlob(canvas, type, quality) {
  return new Promise(function (resolve) { canvas.toBlob(resolve, type, quality); });
}

export async function compressImage(file, maxSide, quality) {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
    throw new Error("Please choose a PNG, JPG, WebP or GIF image.");
  }
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  let blob = await toBlob(canvas, "image/webp", quality);
  let ext = "webp";
  if (!blob || blob.type !== "image/webp") {
    // This browser can't encode WebP: use JPEG on a white background (JPEG has no transparency)
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    blob = await toBlob(canvas, "image/jpeg", quality);
    ext = "jpg";
  }
  if (!blob) throw new Error("Could not compress that image.");
  return { blob: blob, ext: ext, width: w, height: h };
}

export function blobToBase64(blob) {
  return new Promise(function (resolve, reject) {
    const r = new FileReader();
    r.onload = function () { resolve(String(r.result).split(",")[1]); };
    r.onerror = function () { reject(new Error("Could not read the image data.")); };
    r.readAsDataURL(blob);
  });
}