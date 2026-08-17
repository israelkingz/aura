import { CARE, GARMENTS } from "./catalog";
import { occasionReason } from "./interpret";
import { scoreOf } from "./parse-skin";
import type {
  CareProduct,
  Garment,
  LookRecommendation,
  OccasionId,
  SkinScores,
} from "./types";

function careFor(scores: SkinScores): CareProduct | undefined {
  const ranked = [
    { key: "redness" as const, product: CARE[0] },
    { key: "oiliness" as const, product: CARE[1] },
    { key: "moisture" as const, product: CARE[2] },
    { key: "radiance" as const, product: CARE[3] },
  ].sort((a, b) => scoreOf(scores, a.key) - scoreOf(scores, b.key));

  const worst = ranked[0];
  if (scoreOf(scores, worst.key) >= 70) return undefined;
  return worst.product;
}

function occasionFit(garment: Garment, occasion: OccasionId) {
  if (occasion === "interview") {
    if (garment.hue === "hot-pink" || garment.saturation === "high") return -18;
    if (garment.id === "navy-blazer" || garment.id === "ivory-shirt") return 12;
  }
  if (occasion === "date") {
    if (garment.fabric === "satin" || garment.hue === "blush") return 6;
    if (garment.id === "navy-blazer") return -4;
  }
  if (occasion === "weekend") {
    if (garment.fabric === "linen" || garment.fabric === "knit") return 10;
    if (garment.id === "navy-blazer") return -8;
  }
  if (occasion === "wedding") {
    if (garment.hue === "hot-pink" || garment.hue === "black") return -10;
    if (garment.hue === "ivory" || garment.hue === "sage") return 8;
  }
  if (occasion === "work") {
    if (garment.neckline === "collar" || garment.id === "navy-blazer") return 8;
    if (garment.hue === "hot-pink") return -14;
  }
  return 0;
}

function styleGarment(
  garment: Garment,
  scores: SkinScores,
  occasion: OccasionId,
): LookRecommendation {
  const redness = scoreOf(scores, "redness");
  const oil = scoreOf(scores, "oiliness");
  const moisture = scoreOf(scores, "moisture");
  const acne = scoreOf(scores, "acne");
  const radiance = scoreOf(scores, "radiance");
  const wrinkle = scoreOf(scores, "wrinkle");
  const texture = scoreOf(scores, "texture");

  let score = 58;
  const reasons: string[] = [];

  if (redness < 60) {
    if (garment.warmth === "warm" || garment.hue === "hot-pink") {
      score -= 22;
      reasons.push(
        `Redness is ${redness}. Warm/high-saturation color will read as more flush on camera and IRL.`,
      );
    } else if (garment.hue === "sage" || garment.hue === "ivory" || garment.hue === "cool-blue") {
      score += 16;
      reasons.push(
        `Redness is ${redness}. ${garment.name} sits on the cool/neutral side so it does not amplify it.`,
      );
    }
  } else {
    score += 4;
  }

  if (oil < 60) {
    if (garment.fabric === "satin" || garment.fabric === "leather") {
      score -= 16;
      reasons.push(
        `Oiliness is ${oil}. ${garment.fabric} bounce light back at the T-zone and can look greasy by noon.`,
      );
    } else if (garment.fabric === "linen" || garment.fabric === "matte") {
      score += 12;
      reasons.push(
        `Oiliness is ${oil}. Matte ${garment.fabric} keeps the face as the only shine in the frame.`,
      );
    }
  }

  if (moisture < 60) {
    if (garment.fabric === "linen" || garment.fabric === "knit") {
      score += 8;
      reasons.push(
        `Moisture is ${moisture}. Breathable ${garment.fabric} will not cling to dry patches.`,
      );
    }
  }

  if (acne < 62 && garment.print === "busy") {
    score -= 10;
    reasons.push(`Acne score is ${acne}. Busy print pulls the eye to texture.`);
  } else if (acne < 62 && garment.print === "solid") {
    score += 6;
    reasons.push(`Solid color keeps attention on cut, not on breakouts.`);
  }

  if (wrinkle < 62 || texture < 62) {
    if (garment.neckline === "turtleneck") {
      score -= 12;
      reasons.push(
        `Texture/wrinkle scores are modest. A hard turtleneck line spotlights the neck and jaw.`,
      );
    } else if (garment.neckline === "open" || garment.neckline === "collar") {
      score += 7;
      reasons.push(`Open neckline gives the face air and hides neck texture.`);
    }
  }

  if (radiance >= 75 && (garment.hue === "jewel" || garment.fabric === "satin")) {
    score += 8;
    reasons.push(`Radiance is ${radiance}. You can wear sheen without looking tired.`);
  }

  score += occasionFit(garment, occasion);

  score = Math.max(8, Math.min(98, Math.round(score)));

  const verdict: LookRecommendation["verdict"] =
    score >= 72 ? "wear" : score >= 52 ? "maybe" : "skip";

  if (!reasons.length) {
    reasons.push(occasionReason(occasion, scores));
  }

  return {
    garment,
    score,
    verdict,
    reasons: reasons.slice(0, 3),
    care: careFor(scores),
  };
}

export function recommendLooks(scores: SkinScores, occasion: OccasionId) {
  const ranked = GARMENTS.map((garment) =>
    styleGarment(garment, scores, occasion),
  ).sort((a, b) => b.score - a.score);

  const looks = ranked.filter((item) => item.verdict !== "skip").slice(0, 3);
  const skips = ranked.filter((item) => item.verdict === "skip").slice(0, 2);
  if (!looks.length && ranked[0]) looks.push(ranked[0]);

  return { looks, skips };
}
