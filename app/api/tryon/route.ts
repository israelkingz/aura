import { garmentById } from "@/lib/catalog";
import { readImageForm } from "@/lib/form";
import { fetchImageBuffer, hasYouCamKey, runClothTryOn } from "@/lib/youcam";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { buffer, form } = await readImageForm(request, "body");
    const garmentId = String(form.get("garmentId") ?? "");
    const garment = garmentById(garmentId);
    if (!garment) {
      return NextResponse.json({ error: "Unknown garment" }, { status: 400 });
    }

    if (!hasYouCamKey()) {
      return NextResponse.json({
        mode: "demo",
        resultUrl: `demo://${garment.id}`,
        garmentId: garment.id,
      });
    }

    const garmentImage = await fetchImageBuffer(garment.image);
    const resultUrl = await runClothTryOn({
      bodyImage: buffer,
      garmentImage,
      garmentCategory: garment.category === "outerwear" ? "upper_body" : garment.category,
    });

    return NextResponse.json({
      mode: "live",
      resultUrl,
      garmentId: garment.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Try-on failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
