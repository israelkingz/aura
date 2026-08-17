import type { SkinConcernScore, SkinScores } from "./types";

const LABELS: Record<string, string> = {
  wrinkle: "Wrinkles",
  redness: "Redness",
  oiliness: "Oiliness",
  acne: "Acne",
  moisture: "Moisture",
  radiance: "Radiance",
  texture: "Texture",
  pore: "Pores",
  age_spot: "Spots",
  dark_circle_v2: "Dark circles",
  dark_circle: "Dark circles",
  firmness: "Firmness",
  hd_wrinkle: "Wrinkles",
  hd_redness: "Redness",
  hd_oiliness: "Oiliness",
  hd_acne: "Acne",
  hd_moisture: "Moisture",
  hd_radiance: "Radiance",
  hd_texture: "Texture",
  hd_pore: "Pores",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function readScore(node: unknown): { ui?: number; raw?: number } {
  const rec = asRecord(node);
  if (!rec) return {};
  const whole = asRecord(rec.whole);
  const source = whole ?? rec;
  const ui = source.ui_score;
  const raw = source.raw_score;
  return {
    ui: typeof ui === "number" ? ui : undefined,
    raw: typeof raw === "number" ? raw : undefined,
  };
}

function readMask(node: unknown): string | undefined {
  const rec = asRecord(node);
  if (!rec) return undefined;
  const urls = rec.mask_urls;
  if (Array.isArray(urls) && typeof urls[0] === "string") return urls[0];
  const whole = asRecord(rec.whole);
  const nested = whole?.output_mask_name ?? rec.output_mask_name;
  return typeof nested === "string" ? nested : undefined;
}

function pushConcern(
  list: SkinConcernScore[],
  key: string,
  node: unknown,
  maskFromType?: string,
) {
  const { ui, raw } = readScore(node);
  if (typeof ui !== "number") return;
  const normalized = key.replace(/^hd_/, "");
  list.push({
    key: normalized,
    label: LABELS[key] ?? LABELS[normalized] ?? normalized,
    uiScore: Math.round(ui),
    rawScore: raw,
    maskUrl: maskFromType ?? readMask(node),
  });
}

export function parseSkinPayload(payload: unknown): SkinScores {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const results = asRecord(data.results) ?? data;
  const concerns: SkinConcernScore[] = [];

  const output = results.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const rec = asRecord(item);
      if (!rec || typeof rec.type !== "string") continue;
      const mask = Array.isArray(rec.mask_urls)
        ? rec.mask_urls.find((url) => typeof url === "string")
        : undefined;
      pushConcern(concerns, rec.type, rec, typeof mask === "string" ? mask : undefined);
    }
  }

  const nestedKeys = [
    "wrinkle",
    "redness",
    "oiliness",
    "acne",
    "moisture",
    "radiance",
    "texture",
    "pore",
    "hd_wrinkle",
    "hd_redness",
    "hd_oiliness",
    "hd_acne",
    "hd_moisture",
    "hd_radiance",
    "hd_texture",
    "hd_pore",
  ];

  for (const key of nestedKeys) {
    if (results[key] !== undefined) pushConcern(concerns, key, results[key]);
    else if (data[key] !== undefined) pushConcern(concerns, key, data[key]);
  }

  const unique = new Map<string, SkinConcernScore>();
  for (const concern of concerns) {
    if (!unique.has(concern.key)) unique.set(concern.key, concern);
  }

  const allNode = asRecord(results.all) ?? asRecord(data.all);
  const overallFromAll =
    typeof allNode?.score === "number" ? allNode.score : undefined;
  const values = [...unique.values()].map((item) => item.uiScore);
  const overall =
    overallFromAll ??
    (values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 70);

  const skinAge =
    typeof results.skin_age === "number"
      ? results.skin_age
      : typeof data.skin_age === "number"
        ? data.skin_age
        : undefined;

  return {
    overall: Math.round(overall),
    skinAge,
    concerns: Object.fromEntries([...unique.entries()]),
  };
}

export function demoSkinScores(): SkinScores {
  const rows: SkinConcernScore[] = [
    { key: "wrinkle", label: "Wrinkles", uiScore: 74 },
    { key: "redness", label: "Redness", uiScore: 48 },
    { key: "oiliness", label: "Oiliness", uiScore: 52 },
    { key: "acne", label: "Acne", uiScore: 81 },
    { key: "moisture", label: "Moisture", uiScore: 58 },
    { key: "radiance", label: "Radiance", uiScore: 71 },
    { key: "texture", label: "Texture", uiScore: 66 },
    { key: "pore", label: "Pores", uiScore: 61 },
  ];
  return {
    overall: 64,
    skinAge: 29,
    concerns: Object.fromEntries(rows.map((row) => [row.key, row])),
  };
}

export function scoreOf(scores: SkinScores, key: string, fallback = 70) {
  return scores.concerns[key]?.uiScore ?? fallback;
}
