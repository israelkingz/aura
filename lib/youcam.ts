import { parseSkinPayload } from "./parse-skin";
import { isFaceTooSmall, tightenFaceFrame } from "./tighten";

const API_BASE =
  process.env.YOUCAM_API_BASE ?? "https://yce-api-01.makeupar.com";

const SD_ACTIONS = [
  "wrinkle",
  "redness",
  "oiliness",
  "acne",
  "moisture",
  "radiance",
  "texture",
  "pore",
];

export function hasYouCamKey() {
  return Boolean(process.env.YOUCAM_API_KEY?.trim());
}

function authHeaders() {
  const key = process.env.YOUCAM_API_KEY?.trim();
  if (!key) throw new Error("YOUCAM_API_KEY is not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function youCamFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => ({}))) as {
    status?: number;
    error?: string;
    error_code?: string;
    data?: unknown;
  };

  if (!response.ok) {
    throw new Error(
      json.error || json.error_code || `YouCam ${response.status} on ${path}`,
    );
  }

  return json;
}

function sniffImage(buffer: Buffer) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return { contentType: "image/png", ext: "png" };
  }
  return { contentType: "image/jpeg", ext: "jpg" };
}

type FileInit = {
  file_id?: string;
  requests?: { method?: string; url?: string; headers?: Record<string, string> }[];
};

async function uploadBuffer(feature: string, buffer: Buffer, name: string) {
  const { contentType, ext } = sniffImage(buffer);
  const fileName = name.endsWith(`.${ext}`) ? name : `${name}.${ext}`;

  const init = await youCamFetch(`/s2s/v2.0/file/${feature}`, {
    method: "POST",
    body: JSON.stringify({
      files: [
        {
          content_type: contentType,
          file_name: fileName,
          file_size: buffer.length,
        },
      ],
    }),
  });

  const file = (init.data as { files?: FileInit[] } | undefined)?.files?.[0];
  if (!file?.file_id || !file.requests?.[0]?.url) {
    throw new Error(`File API did not return an upload URL for ${feature}`);
  }

  const upload = file.requests[0];
  const uploadUrl = upload.url;
  if (!uploadUrl) {
    throw new Error(`File API did not return an upload URL for ${feature}`);
  }

  const put = await fetch(uploadUrl, {
    method: upload.method ?? "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      ...(upload.headers ?? {}),
    },
    body: new Uint8Array(buffer),
  });

  if (!put.ok) {
    throw new Error(`Upload to YouCam storage failed (${put.status})`);
  }

  return file.file_id;
}

async function pollTask(feature: string, taskId: string, attempts = 45) {
  let last: unknown = null;

  for (let i = 0; i < attempts; i += 1) {
    const json = await youCamFetch(`/s2s/v2.0/task/${feature}/${taskId}`, {
      method: "GET",
    });
    last = json;
    const data = (json.data ?? {}) as {
      task_status?: string;
      error?: string | null;
      polling_interval?: number;
    };
    const status = data.task_status;

    if (status === "success") return json;
    if (status === "error") {
      throw new Error(data.error || `${feature} task failed`);
    }

    const waitMs = Math.min(8000, Math.max(1500, (data.polling_interval ?? 2) * 1000));
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  throw new Error(`${feature} timed out. Last payload: ${JSON.stringify(last)}`);
}

async function analyzeBuffer(image: Buffer) {
  const fileId = await uploadBuffer("skin-analysis", image, "aura-face");
  const created = await youCamFetch("/s2s/v2.0/task/skin-analysis", {
    method: "POST",
    body: JSON.stringify({
      src_file_id: fileId,
      dst_actions: SD_ACTIONS,
      format: "json",
      miniserver_args: {
        enable_mask_overlay: true,
      },
    }),
  });

  const taskId = (created.data as { task_id?: string } | undefined)?.task_id;
  if (!taskId) throw new Error("Skin analysis did not return a task_id");
  return pollTask("skin-analysis", taskId);
}

export async function runSkinAnalysis(image: Buffer) {
  try {
    return parseSkinPayload(await analyzeBuffer(image));
  } catch (error) {
    if (!isFaceTooSmall(error)) throw error;
    const tight = await tightenFaceFrame(image, 1.85);
    try {
      return parseSkinPayload(await analyzeBuffer(tight));
    } catch (retryError) {
      if (!isFaceTooSmall(retryError)) throw retryError;
      const closer = await tightenFaceFrame(image, 2.4);
      return parseSkinPayload(await analyzeBuffer(closer));
    }
  }
}

export async function runClothTryOn(params: {
  bodyImage: Buffer;
  garmentImage: Buffer;
  garmentCategory: string;
}) {
  const [srcId, refId] = await Promise.all([
    uploadBuffer("cloth-v3", params.bodyImage, "aura-body"),
    uploadBuffer("cloth-v3", params.garmentImage, "aura-garment"),
  ]);

  const created = await youCamFetch("/s2s/v2.0/task/cloth-v3", {
    method: "POST",
    body: JSON.stringify({
      src_file_id: srcId,
      ref_file_id: refId,
      garment_category: params.garmentCategory,
    }),
  });

  const taskId = (created.data as { task_id?: string } | undefined)?.task_id;
  if (!taskId) throw new Error("Clothes VTO did not return a task_id");

  const done = await pollTask("cloth-v3", taskId, 60);
  const data = (done.data ?? {}) as {
    results?: { url?: string; output?: { url?: string }[] };
  };
  const url = data.results?.url || data.results?.output?.[0]?.url;
  if (!url) {
    throw new Error(`VTO succeeded but no image URL was returned: ${JSON.stringify(done)}`);
  }

  return url;
}

export async function fetchImageBuffer(url: string) {
  if (url.startsWith("/")) {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    return readFile(join(process.cwd(), "public", url));
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`Could not download garment image (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}
