export async function canvasToFile(canvas: HTMLCanvasElement, name: string) {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("Could not encode photo");
  return new File([blob], name, { type: "image/jpeg" });
}

function coverCrop(
  sourceW: number,
  sourceH: number,
  aspect: number,
  zoom: number,
) {
  let sx = 0;
  let sy = 0;
  let sw = sourceW;
  let sh = sourceH;
  if (sourceW / sourceH > aspect) {
    sw = sourceH * aspect;
    sx = (sourceW - sw) / 2;
  } else {
    sh = sourceW / aspect;
    sy = (sourceH - sh) / 2;
  }
  const zw = sw / zoom;
  const zh = sh / zoom;
  return {
    sx: sx + (sw - zw) / 2,
    sy: sy + (sh - zh) / 2,
    sw: zw,
    sh: zh,
  };
}

export function cropVideoToPortrait(
  video: HTMLVideoElement,
  mode: "face" | "body",
) {
  const aspect = 3 / 4;
  const zoom = mode === "face" ? 1.65 : 1.08;
  const crop = coverCrop(video.videoWidth, video.videoHeight, aspect, zoom);
  const width = mode === "face" ? 1200 : 1080;
  const height = Math.round(width / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(
    video,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    width,
    height,
  );
  return canvas;
}

type DetectedBox = { x: number; y: number; width: number; height: number };

async function detectFaceBox(bitmap: ImageBitmap): Promise<DetectedBox | null> {
  const FaceDetectorCtor = (
    window as Window & {
      FaceDetector?: new (options?: {
        fastMode?: boolean;
        maxDetectedFaces?: number;
      }) => {
        detect: (
          image: HTMLCanvasElement,
        ) => Promise<{ boundingBox: DetectedBox }[]>;
      };
    }
  ).FaceDetector;
  if (!FaceDetectorCtor) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const detector = new FaceDetectorCtor({
      fastMode: false,
      maxDetectedFaces: 1,
    });
    const faces = await detector.detect(canvas);
    return faces[0]?.boundingBox ?? null;
  } catch {
    return null;
  }
}

export async function prepareStill(file: File, mode: "face" | "body") {
  const bitmap = await createImageBitmap(file);
  const aspect = 3 / 4;
  const width = mode === "face" ? 1200 : 1080;
  const height = Math.round(width / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  if (mode === "face") {
    const box = await detectFaceBox(bitmap);
    if (box) {
      const padX = box.width * 0.28;
      const padY = box.height * 0.38;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2 - box.height * 0.04;
      let cropW = Math.max(box.width + padX * 2, (box.height + padY * 2) * aspect);
      let cropH = cropW / aspect;
      let sx = cx - cropW / 2;
      let sy = cy - cropH / 2;
      if (sx < 0) sx = 0;
      if (sy < 0) sy = 0;
      if (sx + cropW > bitmap.width) sx = Math.max(0, bitmap.width - cropW);
      if (sy + cropH > bitmap.height) sy = Math.max(0, bitmap.height - cropH);
      cropW = Math.min(cropW, bitmap.width - sx);
      cropH = cropW / aspect;
      ctx.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, width, height);
      return canvasToFile(canvas, "face.jpg");
    }
  }

  const crop = coverCrop(
    bitmap.width,
    bitmap.height,
    aspect,
    mode === "face" ? 1.7 : 1.08,
  );
  ctx.drawImage(
    bitmap,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    width,
    height,
  );
  return canvasToFile(canvas, `${mode}.jpg`);
}
