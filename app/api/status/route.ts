import { hasYouCamKey } from "@/lib/youcam";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    live: hasYouCamKey(),
    apis: ["skin-analysis", "cloth-v3"],
  });
}
