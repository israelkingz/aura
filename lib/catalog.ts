import type { CareProduct, Garment, OccasionId } from "./types";

export const OCCASIONS: {
  id: OccasionId;
  label: string;
  hint: string;
}[] = [
  { id: "interview", label: "Interview", hint: "Quiet authority" },
  { id: "date", label: "Date night", hint: "Soft focus, not glare" },
  { id: "weekend", label: "Weekend", hint: "Breathable ease" },
  { id: "wedding", label: "Wedding guest", hint: "Polished, not flushed" },
  { id: "work", label: "Work week", hint: "Camera-ready days" },
];

export const GARMENTS: Garment[] = [
  {
    id: "sage-knit",
    name: "Sage Fine Knit",
    price: 128,
    category: "upper_body",
    hue: "sage",
    warmth: "cool",
    saturation: "low",
    fabric: "knit",
    neckline: "open",
    print: "solid",
    image: "/garments/sage-knit.jpg",
    blurb: "Low-saturation green that calms visible redness.",
  },
  {
    id: "ivory-shirt",
    name: "Ivory Poplin Shirt",
    price: 98,
    category: "upper_body",
    hue: "ivory",
    warmth: "neutral",
    saturation: "low",
    fabric: "matte",
    neckline: "collar",
    print: "solid",
    image: "/garments/ivory-shirt.jpg",
    blurb: "Open collar, matte cotton. Lets skin, not fabric, carry the light.",
  },
  {
    id: "navy-blazer",
    name: "Navy Structured Blazer",
    price: 248,
    category: "upper_body",
    hue: "navy",
    warmth: "cool",
    saturation: "medium",
    fabric: "matte",
    neckline: "open",
    print: "solid",
    image: "/garments/navy-blazer.jpg",
    blurb: "Cool navy frames the face without competing with undertone.",
  },
  {
    id: "linen-set",
    name: "Oat Linen Shirt",
    price: 142,
    category: "upper_body",
    hue: "ivory",
    warmth: "neutral",
    saturation: "low",
    fabric: "linen",
    neckline: "open",
    print: "solid",
    image: "/garments/linen-shirt.jpg",
    blurb: "Breathable linen for low-moisture, high-oil days.",
  },
  {
    id: "cool-silk",
    name: "Slate Satin Blouse",
    price: 186,
    category: "upper_body",
    hue: "cool-blue",
    warmth: "cool",
    saturation: "medium",
    fabric: "satin",
    neckline: "open",
    print: "solid",
    image: "/garments/slate-blouse.jpg",
    blurb: "Jewel-adjacent sheen. Beautiful on high-radiance skin, risky on oil.",
  },
  {
    id: "blush-knit",
    name: "Dusty Blush Cardigan",
    price: 118,
    category: "upper_body",
    hue: "blush",
    warmth: "warm",
    saturation: "medium",
    fabric: "knit",
    neckline: "open",
    print: "solid",
    image: "/garments/blush-knit.jpg",
    blurb: "Warm pink. Amplifies flush when redness is already high.",
  },
  {
    id: "moto-pink",
    name: "Magenta Moto Jacket",
    price: 129,
    category: "upper_body",
    hue: "hot-pink",
    warmth: "warm",
    saturation: "high",
    fabric: "leather",
    neckline: "open",
    print: "solid",
    image: "/garments/moto-jacket.jpg",
    blurb: "High-saturation leather. A product-page hero that often fails on real skin.",
  },
  {
    id: "black-turtleneck",
    name: "Ink Turtleneck",
    price: 110,
    category: "upper_body",
    hue: "black",
    warmth: "neutral",
    saturation: "low",
    fabric: "knit",
    neckline: "turtleneck",
    print: "solid",
    image: "/garments/turtleneck.jpg",
    blurb: "Sharp on camera. Tight neckline can spotlight texture and lines.",
  },
];

export const CARE: CareProduct[] = [
  {
    id: "calm-serum",
    name: "Barrier Calm Serum",
    price: 38,
    targets: ["redness"],
    blurb: "Niacinamide + centella. 60-second pre-outfit press, no film.",
  },
  {
    id: "oil-gel",
    name: "Soft-Matte Balancing Gel",
    price: 32,
    targets: ["oiliness", "pore"],
    blurb: "Blots shine without stripping. Keeps satin from looking wet.",
  },
  {
    id: "moisture-cream",
    name: "Cloud Barrier Cream",
    price: 44,
    targets: ["moisture", "texture"],
    blurb: "Ceramide cream so linen and knits sit on skin, not cling to dry patches.",
  },
  {
    id: "radiance-drops",
    name: "Quiet Glow Drops",
    price: 42,
    targets: ["radiance", "acne"],
    blurb: "Vitamin C at a wear-under-clothes strength. No glitter, no cast.",
  },
];

export const YOUCAM_SAMPLE_GARMENT =
  "https://plugins-media.makeupar.com/strapi/assets/clothes_reference_full_body_01_5a000d999f.png";

export function garmentById(id: string) {
  return GARMENTS.find((item) => item.id === id);
}

export function careById(id: string) {
  return CARE.find((item) => item.id === id);
}
