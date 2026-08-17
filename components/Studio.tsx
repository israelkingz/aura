"use client";

import { Capture } from "@/components/Capture";
import { Gauge } from "@/components/Gauge";
import { OCCASIONS } from "@/lib/catalog";
import type {
  AnalyzeResponse,
  LookRecommendation,
  OccasionId,
  SkinConcernScore,
} from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type Step =
  | "home"
  | "occasion"
  | "face"
  | "body"
  | "analyze"
  | "looks"
  | "tryon"
  | "cart";

const STEP_LABEL: Record<Step, string> = {
  home: "Studio",
  occasion: "Moment",
  face: "Skin",
  body: "Frame",
  analyze: "Read",
  looks: "Looks",
  tryon: "Try-on",
  cart: "Cart",
};

export function Studio() {
  const [step, setStep] = useState<Step>("home");
  const [live, setLive] = useState<boolean | null>(null);
  const [occasion, setOccasion] = useState<OccasionId>("work");
  const [face, setFace] = useState<{ file: File; preview: string } | null>(null);
  const [body, setBody] = useState<{ file: File; preview: string } | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [selected, setSelected] = useState<LookRecommendation | null>(null);
  const [tryOnUrl, setTryOnUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data: { live?: boolean }) => setLive(Boolean(data.live)))
      .catch(() => setLive(false));
  }, []);

  const concerns = useMemo(() => {
    if (!analysis) return [];
    return Object.values(analysis.scores.concerns).sort(
      (a, b) => a.uiScore - b.uiScore,
    );
  }, [analysis]);

  const runAnalyze = async () => {
    if (!face) return;
    setBusy(true);
    setError(null);
    setStep("analyze");
    try {
      const form = new FormData();
      form.set("face", face.file);
      form.set("occasion", occasion);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const json = (await res.json()) as AnalyzeResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "Skin analysis failed");
      setAnalysis(json);
      setSelected(json.looks[0] ?? null);
      setStep("looks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("face");
    } finally {
      setBusy(false);
    }
  };

  const runTryOn = async (look: LookRecommendation) => {
    if (!body) {
      setSelected(look);
      setStep("body");
      return;
    }
    setSelected(look);
    setBusy(true);
    setError(null);
    setStep("tryon");
    try {
      const form = new FormData();
      form.set("body", body.file);
      form.set("garmentId", look.garment.id);
      const res = await fetch("/api/tryon", { method: "POST", body: form });
      const json = (await res.json()) as {
        resultUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Try-on failed");
      setTryOnUrl(json.resultUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try-on failed");
    } finally {
      setBusy(false);
    }
  };

  const total = selected
    ? selected.garment.price + (selected.care?.price ?? 0)
    : 0;

  return (
    <div className="circuit min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <button type="button" onClick={() => setStep("home")} className="text-left">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80">
            YouCam × Aura
          </p>
          <p className="font-display text-2xl">Aura</p>
        </button>
        <div className="flex items-center gap-3">
          <span className="pill">{live ? "Live API" : "Demo mode"}</span>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm"
          >
            Cart {selected ? "1" : "0"}
          </button>
        </div>
      </header>

      {step === "home" ? <Home onStart={() => setStep("occasion")} live={live} /> : null}

      {step !== "home" ? (
        <main className="mx-auto grid max-w-6xl gap-8 px-6 pb-24 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-6">
            <ol className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
              {(Object.keys(STEP_LABEL) as Step[])
                .filter((item) => item !== "home")
                .map((item) => (
                  <li
                    key={item}
                    className={item === step ? "text-sky-300" : undefined}
                  >
                    {STEP_LABEL[item]}
                  </li>
                ))}
            </ol>

            {step === "occasion" ? (
              <div className="space-y-4">
                <h2 className="font-display text-4xl">What is the room you are walking into?</h2>
                <p className="text-white/60">
                  Aura styles for the skin you have today, not the skin in the product photo.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {OCCASIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOccasion(item.id)}
                      className={`rounded-2xl border px-4 py-4 text-left ${
                        occasion === item.id
                          ? "border-sky-300/60 bg-sky-300/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-white/50">{item.hint}</p>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep("face")}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink"
                >
                  Continue to skin scan
                </button>
              </div>
            ) : null}

            {step === "face" ? (
              <div className="space-y-4">
                <h2 className="font-display text-4xl">Let Skin AI read the day.</h2>
                <p className="text-white/60">
                  YouCam Skin AI rejects a face that is too small in the frame. Sit close until chin-to-hairline fills the oval. Use http://localhost:3000 so the camera can start.
                </p>
                <Capture
                  mode="face"
                  onCapture={(file, preview) => setFace({ file, preview })}
                  onSkipFile={(file, preview) => setFace({ file, preview })}
                />
                {face ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={face.preview} alt="Selfie" className="h-16 w-16 rounded-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void runAnalyze()}
                      className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink"
                    >
                      Analyze my skin
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === "body" ? (
              <div className="space-y-4">
                <h2 className="font-display text-4xl">Now the body YouCam VTO needs.</h2>
                <p className="text-white/60">
                  Skin AI wants a close face. Clothes V3 wants shoulders and torso. Aura keeps them as two shots so both models get a clean input.
                </p>
                <Capture
                  mode="body"
                  onCapture={(file, preview) => setBody({ file, preview })}
                  onSkipFile={(file, preview) => setBody({ file, preview })}
                />
                {body && selected ? (
                  <button
                    type="button"
                    onClick={() => void runTryOn(selected)}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink"
                  >
                    Render {selected.garment.name}
                  </button>
                ) : null}
              </div>
            ) : null}

            {step === "analyze" ? (
              <div className="glass rounded-3xl p-8">
                <p className="pill">YouCam Skin Analysis</p>
                <h2 className="mt-4 font-display text-4xl">Reading texture, flush, oil, moisture.</h2>
                <p className="mt-3 text-white/60">
                  Overlay masks and UI scores come back from the same dermatology-trained model used by 800+ beauty brands.
                </p>
              </div>
            ) : null}

            {step === "looks" && analysis ? (
              <LooksPanel
                analysis={analysis}
                concerns={concerns}
                selected={selected}
                onSelect={(look) => {
                  setSelected(look);
                  setTryOnUrl(null);
                }}
                onTry={(look) => void runTryOn(look)}
              />
            ) : null}

            {step === "tryon" && selected ? (
              <div className="space-y-4">
                <p className="pill">YouCam Apparel VTO · cloth-v3</p>
                <h2 className="font-display text-4xl">{selected.garment.name}</h2>
                <p className="text-white/60">{selected.reasons[0]}</p>
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink"
                >
                  Add look + care · ${total}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("looks")}
                  className="ml-3 text-sm text-white/60"
                >
                  Back to looks
                </button>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <Preview
              face={face?.preview}
              body={body?.preview}
              selected={selected}
              tryOnUrl={tryOnUrl}
              busy={busy}
              step={step}
            />
            {error ? (
              <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}
            {analysis?.mode === "demo" ? (
              <p className="text-xs leading-5 text-white/40">
                Demo mode is on because `YOUCAM_API_KEY` is empty. Drop the key into `.env.local` after you redeem units and the same flow calls live Skin Analysis + cloth-v3.
              </p>
            ) : null}
          </aside>
        </main>
      ) : null}

      {cartOpen && selected ? (
        <Cart
          look={selected}
          total={total}
          onClose={() => setCartOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Home({
  onStart,
  live,
}: {
  onStart: () => void;
  live: boolean | null;
}) {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-6 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="pill">Skin AI + Apparel VTO</p>
        <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-6xl">
          Dress the skin you have today.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/65">
          Online fashion still sells you a model&apos;s complexion. Aura reads your
          redness, oil, and texture with YouCam Skin AI, then refuses garments that
          will clash — and renders the ones that won&apos;t with Apparel VTO.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStart}
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-ink"
          >
            Open the studio
          </button>
          <span className="self-center text-sm text-white/45">
            {live ? "Connected to YouCam" : "Works in demo until your key lands"}
          </span>
        </div>
        <dl className="mt-12 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-white/40">Read</dt>
            <dd>Skin Analysis scores + masks</dd>
          </div>
          <div>
            <dt className="text-white/40">Reason</dt>
            <dd>Wear / skip for this hour</dd>
          </div>
          <div>
            <dt className="text-white/40">Render</dt>
            <dd>cloth-v3 on your body</dd>
          </div>
        </dl>
      </div>
      <div className="glass relative overflow-hidden rounded-[32px] p-6 shadow-glow">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          Today&apos;s skin state
        </p>
        <div className="mt-6 flex justify-around">
          <Gauge label="Redness" value={48} accent="#fb7185" />
          <Gauge label="Oiliness" value={52} accent="#fbbf24" />
          <Gauge label="Radiance" value={71} accent="#5CB8FF" />
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-rose-200">Skip · Magenta moto</p>
          <p className="mt-1 text-sm text-white/55">
            High-saturation leather will read as more flush while redness is 48.
          </p>
          <p className="mt-4 text-sm text-sky-200">Wear · Sage fine knit</p>
          <p className="mt-1 text-sm text-white/55">
            Cool, low-saturation knit. Add Barrier Calm Serum to the cart.
          </p>
        </div>
      </div>
    </section>
  );
}

function LooksPanel({
  analysis,
  concerns,
  selected,
  onSelect,
  onTry,
}: {
  analysis: AnalyzeResponse;
  concerns: SkinConcernScore[];
  selected: LookRecommendation | null;
  onSelect: (look: LookRecommendation) => void;
  onTry: (look: LookRecommendation) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="pill">Skin report · {analysis.occasion}</p>
        <h2 className="mt-3 font-display text-4xl">
          Overall {analysis.scores.overall}
          {analysis.scores.skinAge ? ` · skin age ${analysis.scores.skinAge}` : ""}
        </h2>
      </div>
      <div className="flex flex-wrap gap-4">
        {concerns.slice(0, 6).map((item) => (
          <Gauge
            key={item.key}
            label={item.label}
            value={item.uiScore}
            accent={item.uiScore < 60 ? "#fb7185" : "#5CB8FF"}
          />
        ))}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm uppercase tracking-[0.16em] text-white/45">Wear these</h3>
        {analysis.looks.map((look) => (
          <button
            key={look.garment.id}
            type="button"
            onClick={() => onSelect(look)}
            className={`w-full rounded-2xl border p-4 text-left ${
              selected?.garment.id === look.garment.id
                ? "border-sky-300/50 bg-sky-300/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{look.garment.name}</p>
                <p className="text-sm text-white/55">{look.reasons[0]}</p>
              </div>
              <span className="text-sm text-sky-200">{look.score}</span>
            </div>
          </button>
        ))}
      </div>
      {analysis.skips.length ? (
        <div className="space-y-3">
          <h3 className="text-sm uppercase tracking-[0.16em] text-rose-200/80">
            Do not wear these today
          </h3>
          {analysis.skips.map((look) => (
            <div key={look.garment.id} className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4">
              <p className="font-medium">{look.garment.name}</p>
              <p className="text-sm text-white/55">{look.reasons[0]}</p>
            </div>
          ))}
        </div>
      ) : null}
      {selected ? (
        <button
          type="button"
          onClick={() => onTry(selected)}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink"
        >
          Try on {selected.garment.name}
        </button>
      ) : null}
    </div>
  );
}

function Preview({
  face,
  body,
  selected,
  tryOnUrl,
  busy,
  step,
}: {
  face?: string;
  body?: string;
  selected: LookRecommendation | null;
  tryOnUrl: string | null;
  busy: boolean;
  step: Step;
}) {
  const demo = tryOnUrl?.startsWith("demo://");
  const image = !demo && tryOnUrl ? tryOnUrl : body || face;

  return (
    <div className="glass sticky top-6 overflow-hidden rounded-[28px]">
      <div className="relative aspect-[4/5] bg-black/40">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-white/30">
            Capture to fill the mirror
          </div>
        )}
        {demo && selected ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-sm">Demo composite · {selected.garment.name}</p>
            <p className="text-xs text-white/60">
              Live cloth-v3 replaces this with YouCam&apos;s generated wear image.
            </p>
          </div>
        ) : null}
        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-black/50 text-sm">
            {step === "analyze" ? "Running Skin AI…" : "Rendering Apparel VTO…"}
          </div>
        ) : null}
      </div>
      {selected ? (
        <div className="border-t border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">
            Why this, on this face
          </p>
          <p className="mt-2 text-sm text-white/75">{selected.reasons[0]}</p>
        </div>
      ) : null}
    </div>
  );
}

function Cart({
  look,
  total,
  onClose,
}: {
  look: LookRecommendation;
  total: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <p className="pill">Retail close</p>
        <h3 className="mt-3 font-display text-3xl">Your cart for this skin state</h3>
        <ul className="mt-6 space-y-3 text-sm">
          <li className="flex justify-between">
            <span>{look.garment.name}</span>
            <span>${look.garment.price}</span>
          </li>
          {look.care ? (
            <li className="flex justify-between text-sky-100">
              <span>{look.care.name}</span>
              <span>${look.care.price}</span>
            </li>
          ) : null}
        </ul>
        {look.care ? (
          <p className="mt-4 text-sm text-white/55">{look.care.blurb}</p>
        ) : null}
        <p className="mt-6 flex justify-between text-lg">
          <span>Total</span>
          <span>${total}</span>
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-full bg-white py-3 text-sm font-medium text-ink"
        >
          Buy the look
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-sm text-white/50"
        >
          Keep styling
        </button>
      </div>
    </div>
  );
}
