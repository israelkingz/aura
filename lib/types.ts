export type OccasionId =
  | "interview"
  | "date"
  | "weekend"
  | "wedding"
  | "work";

export type GarmentCategory = "upper_body" | "full_body" | "outerwear";

export type HueFamily =
  | "ivory"
  | "sage"
  | "cool-blue"
  | "navy"
  | "blush"
  | "hot-pink"
  | "black"
  | "jewel";

export type FabricFinish = "matte" | "satin" | "leather" | "knit" | "linen";

export type SkinConcern =
  | "wrinkle"
  | "redness"
  | "oiliness"
  | "acne"
  | "moisture"
  | "radiance"
  | "texture"
  | "pore";

export type SkinScores = {
  overall: number;
  skinAge?: number;
  concerns: Record<string, SkinConcernScore>;
};

export type SkinConcernScore = {
  key: string;
  label: string;
  uiScore: number;
  rawScore?: number;
  maskUrl?: string;
};

export type Garment = {
  id: string;
  name: string;
  price: number;
  category: GarmentCategory;
  hue: HueFamily;
  warmth: "cool" | "neutral" | "warm";
  saturation: "low" | "medium" | "high";
  fabric: FabricFinish;
  neckline: "open" | "crew" | "turtleneck" | "collar";
  print: "solid" | "busy";
  image: string;
  blurb: string;
};

export type CareProduct = {
  id: string;
  name: string;
  price: number;
  targets: SkinConcern[];
  blurb: string;
};

export type LookRecommendation = {
  garment: Garment;
  score: number;
  verdict: "wear" | "maybe" | "skip";
  reasons: string[];
  care?: CareProduct;
};

export type AnalyzeResponse = {
  mode: "live" | "demo";
  scores: SkinScores;
  looks: LookRecommendation[];
  skips: LookRecommendation[];
  occasion: OccasionId;
};

export type TryOnResponse = {
  mode: "live" | "demo";
  resultUrl: string;
  garmentId: string;
};
