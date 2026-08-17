import sharp from "sharp";

export async function tightenFaceFrame(buffer: Buffer, zoom = 1.7) {
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < 32 || height < 32) return buffer;

  const aspect = 3 / 4;
  let cropW: number;
  let cropH: number;
  let left: number;
  let top: number;

  if (width / height > aspect) {
    cropH = height;
    cropW = Math.round(height * aspect);
    left = Math.round((width - cropW) / 2);
    top = 0;
  } else {
    cropW = width;
    cropH = Math.round(width / aspect);
    left = 0;
    top = Math.round((height - cropH) / 2);
  }

  const zoomW = Math.max(64, Math.round(cropW / zoom));
  const zoomH = Math.round(zoomW / aspect);
  const zoomLeft = left + Math.round((cropW - zoomW) / 2);
  const zoomTop = top + Math.round((cropH - zoomH) / 2);

  return image
    .extract({
      left: Math.max(0, zoomLeft),
      top: Math.max(0, zoomTop),
      width: Math.min(zoomW, width - Math.max(0, zoomLeft)),
      height: Math.min(zoomH, height - Math.max(0, zoomTop)),
    })
    .resize(1200, 1600, { fit: "fill" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

export function isFaceTooSmall(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  return /face_too_small|face too small/i.test(text);
}
