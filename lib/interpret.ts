import { OCCASIONS } from "./catalog";
import { scoreOf } from "./parse-skin";
import type {
  LookRecommendation,
  OccasionId,
  SkinConcernScore,
  SkinScores,
} from "./types";

export type ScoreBand = "good" | "watch" | "focus";

export type SkinReading = {
  key: string;
  label: string;
  score: number;
  band: ScoreBand;
  headline: string;
  meaning: string;
  forClothes: string;
};

export type EventBrief = {
  id: OccasionId;
  label: string;
  room: string;
  lighting: string;
  story: string;
};

const BAND_COPY: Record<
  string,
  Record<ScoreBand, { headline: string; meaning: string; forClothes: string }>
> = {
  redness: {
    good: {
      headline: "Even tone today",
      meaning:
        "Flush is quiet. Cheeks should not fight the camera or a strong color.",
      forClothes: "You can wear warmer colors without looking more flushed.",
    },
    watch: {
      headline: "A little color in the cheeks",
      meaning:
        "Some warmth is showing. It is normal, but bright pink next to it will look like more redness.",
      forClothes: "Stay on the cool or ivory side if the room has strong light.",
    },
    focus: {
      headline: "Visible flush today",
      meaning:
        "Your face is reading warmer than the product-page model. Hot pink, red, and orange clothes will look like extra flush, not extra style.",
      forClothes: "Wear sage, ivory, or navy. Skip magenta leather and dusty blush knits.",
    },
  },
  oiliness: {
    good: {
      headline: "A calm T-zone",
      meaning: "Shine is under control. Satin will not turn greasy by noon.",
      forClothes: "Sheen and leather are safe if the rest of the look is quiet.",
    },
    watch: {
      headline: "A bit of shine",
      meaning:
        "The T-zone may catch office or flash lighting. Shiny fabric next to it doubles the glare.",
      forClothes: "Prefer matte cotton or linen. Save satin for a low-light room.",
    },
    focus: {
      headline: "Oil is leading the face",
      meaning:
        "Light will bounce off the forehead and nose. Leather and satin can look wet by midday.",
      forClothes: "Matte shirts and knits. A soft-matte gel before you dress.",
    },
  },
  moisture: {
    good: {
      headline: "Skin is holding water",
      meaning: "The surface looks comfortable. Fabric should sit cleanly.",
      forClothes: "Most weaves are fine, including closer knits.",
    },
    watch: {
      headline: "A little dry",
      meaning: "Tightness can make clingy fabric look patchy on the neck and chest.",
      forClothes: "Breathable linen or an open knit is kinder than a tight turtleneck.",
    },
    focus: {
      headline: "Dryness is showing",
      meaning:
        "Low moisture makes texture more visible and makes synthetics cling.",
      forClothes: "Linen or fine knit, and a barrier cream before the collar goes on.",
    },
  },
  radiance: {
    good: {
      headline: "Light is coming back",
      meaning: "The face has life. Jewel tones and a little sheen will look intentional.",
      forClothes: "You can take a stronger color without looking tired.",
    },
    watch: {
      headline: "A softer glow",
      meaning: "The face is fine, but a dull fabric plus a dull complexion can flatten on camera.",
      forClothes: "Ivory and sage keep you awake without shouting.",
    },
    focus: {
      headline: "The face looks tired",
      meaning: "Low radiance makes black and high-shine pieces look heavier than they are.",
      forClothes: "Lift with ivory or sage. Skip ink turtlenecks and hot pink.",
    },
  },
  acne: {
    good: {
      headline: "A clear day",
      meaning: "Breakouts are not pulling the eye. Prints would be a style choice, not a cover.",
      forClothes: "Solid or print — either works.",
    },
    watch: {
      headline: "A few marks",
      meaning: "Busy pattern next to the face makes people look at texture, not the cut.",
      forClothes: "Stay solid. Let the neckline do the work.",
    },
    focus: {
      headline: "Breakouts are visible",
      meaning: "High-contrast prints and tight crew necks frame the problem.",
      forClothes: "Clean solids and an open collar so the eye lands on the outfit.",
    },
  },
  wrinkle: {
    good: {
      headline: "Lines are quiet",
      meaning: "A sharp neckline will not spotlight the jaw.",
      forClothes: "Turtlenecks are optional, not a risk.",
    },
    watch: {
      headline: "Some lines around the face",
      meaning: "Hard edges at the neck can make lines look deeper under overhead light.",
      forClothes: "Open collars and soft knits beat a tight turtleneck today.",
    },
    focus: {
      headline: "Texture at the neck and eyes",
      meaning: "A hard turtleneck line is a highlighter for lines you do not need to advertise.",
      forClothes: "Open neckline. Skip the ink turtleneck.",
    },
  },
  texture: {
    good: {
      headline: "A smooth surface",
      meaning: "Close fabrics will not catch on dry or uneven patches.",
      forClothes: "Most weaves are fair.",
    },
    watch: {
      headline: "Texture is a little loud",
      meaning: "Roughness shows more in raking light — windows, office LEDs, flash.",
      forClothes: "Softer knits and open collars hide more than a tight black knit.",
    },
    focus: {
      headline: "Texture is easy to see",
      meaning: "Busy fabric plus visible texture is two patterns at once.",
      forClothes: "Smooth, solid, breathable. Not leather, not a tight neck.",
    },
  },
  pore: {
    good: {
      headline: "Pores are not the story",
      meaning: "Close-up photos should still look like you, not like texture.",
      forClothes: "No special fabric rules from pores today.",
    },
    watch: {
      headline: "Pores catching the light",
      meaning: "Shine makes pores look larger. Matte clothes keep the face from competing.",
      forClothes: "Matte over satin.",
    },
    focus: {
      headline: "Pores are catching every light",
      meaning: "Combined with oil, this is why product photos lie. The model was not this shiny.",
      forClothes: "Matte ivory or sage, and blot before you walk in.",
    },
  },
};

function bandFor(score: number): ScoreBand {
  if (score >= 75) return "good";
  if (score >= 60) return "watch";
  return "focus";
}

export function interpretScores(scores: SkinScores): SkinReading[] {
  return Object.values(scores.concerns)
    .map((concern) => toReading(concern))
    .sort((a, b) => a.score - b.score);
}

function toReading(concern: SkinConcernScore): SkinReading {
  const band = bandFor(concern.uiScore);
  const pack =
    BAND_COPY[concern.key]?.[band] ?? {
      headline: concern.label,
      meaning: `Score ${concern.uiScore} of 100. Higher is calmer, healthier-looking skin.`,
      forClothes: "Use this as a tie-breaker when two looks feel equal.",
    };
  return {
    key: concern.key,
    label: concern.label,
    score: concern.uiScore,
    band,
    headline: pack.headline,
    meaning: pack.meaning,
    forClothes: pack.forClothes,
  };
}

export function overallReading(scores: SkinScores): string {
  const n = scores.overall;
  if (n >= 80) {
    return `Overall ${n}. The face is in good shape. Dress for the room, not for damage control.`;
  }
  if (n >= 65) {
    return `Overall ${n}. Nothing is “wrong” — a couple of scores are loud enough that the wrong color or fabric will show it.`;
  }
  return `Overall ${n}. Today’s skin will change how clothes look on you versus the product photo. Dress around the lowest scores, not the catalog hero.`;
}

const EVENT_ROOM: Record<
  OccasionId,
  Omit<EventBrief, "id" | "label" | "story">
> = {
  interview: {
    room: "A bright office or a laptop camera",
    lighting: "Overhead LEDs and a webcam that exaggerates flush and shine",
  },
  date: {
    room: "A restaurant, bar, or evening walk",
    lighting: "Warm lamps that can make redness look romantic — or inflamed",
  },
  weekend: {
    room: "Daylight, errands, a long stretch in one outfit",
    lighting: "Changing sun. Oil and dry patches show up by afternoon",
  },
  wedding: {
    room: "Ceremony light, then flash photography",
    lighting: "Every photo is a close-up of your face next to the clothes",
  },
  work: {
    room: "Desk, meetings, maybe a camera-on call",
    lighting: "All-day indoor light. Shine builds. Color has to last",
  },
};

export function briefEvent(
  occasion: OccasionId,
  scores: SkinScores,
  wear?: LookRecommendation,
  skip?: LookRecommendation,
): EventBrief {
  const meta = OCCASIONS.find((item) => item.id === occasion);
  const room = EVENT_ROOM[occasion];
  const focus = interpretScores(scores)[0];
  const wearName = wear?.garment.name ?? "a quiet, skin-safe piece";
  const skipName = skip?.garment.name;

  const story = [
    `You picked ${meta?.label ?? occasion}. ${room.room}. ${room.lighting}.`,
    focus
      ? `Skin AI’s loudest note is ${focus.label.toLowerCase()} at ${focus.score}: ${focus.headline.toLowerCase()}.`
      : "",
    skipName
      ? `So we do not put you in the ${skipName} — it would look different on you than on the model.`
      : "",
    `We dress you in the ${wearName} so the room sees the outfit, not the skin fight.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: occasion,
    label: meta?.label ?? occasion,
    room: room.room,
    lighting: room.lighting,
    story,
  };
}

export function occasionReason(occasion: OccasionId, scores: SkinScores) {
  const redness = scoreOf(scores, "redness");
  const oil = scoreOf(scores, "oiliness");
  if (occasion === "interview") {
    return `Interview light is cruel. With redness at ${redness} and oil at ${oil}, we keep color quiet so the camera stays on what you say.`;
  }
  if (occasion === "date") {
    return `Date-night lamps are warm. Redness ${redness} can look flushed next to pink. We pick a piece that still feels like an evening, not a warning light.`;
  }
  if (occasion === "weekend") {
    return `Weekend means hours in one look. Moisture and oil have time to shift. Breathable fabric is the whole strategy.`;
  }
  if (occasion === "wedding") {
    return `Wedding photos are close-ups. Flash will raise every red and shiny patch. The guest look has to be pale enough to survive that.`;
  }
  return `Work-week light is overhead and long. We dress for 4pm you, not 8am catalog you.`;
}
