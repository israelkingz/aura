import { recommendLooks } from "@/lib/agent";
import { readImageForm } from "@/lib/form";
import { demoSkinScores } from "@/lib/parse-skin";
import type { OccasionId } from "@/lib/types";
import { hasYouCamKey, runSkinAnalysis } from "@/lib/youcam";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OCCASIONS: OccasionId[] = [
  "interview",
  "date",
  "weekend",
  "wedding",
  "work",
];

export async function POST(request: Request) {
  try {
    const { buffer, form } = await readImageForm(request, "face");
    const occasionRaw = String(form.get("occasion") ?? "work");
    const occasion = OCCASIONS.includes(occasionRaw as OccasionId)
      ? (occasionRaw as OccasionId)
      : "work";

    const live = hasYouCamKey();
    const scores = live ? await runSkinAnalysis(buffer) : demoSkinScores();
    const { looks, skips } = recommendLooks(scores, occasion);

    return NextResponse.json({
      mode: live ? "live" : "demo",
      scores,
      looks,
      skips,
      occasion,
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Analysis failed";
    const message = /face_too_small/i.test(raw)
      ? "YouCam needs a closer selfie — chin to hairline filling the oval. Recapture or upload a tight face photo."
      : raw;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
