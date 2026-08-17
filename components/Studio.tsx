"use client";

import { Capture } from "@/components/Capture";
import { Gauge } from "@/components/Gauge";
import { OCCASIONS } from "@/lib/catalog";
import {
  briefEvent,
  interpretScores,
  overallReading,
  type SkinReading,
} from "@/lib/interpret";
import type {
  AnalyzeResponse,
  LookRecommendation,
  OccasionId,
} from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const dressedFor = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data: { live?: boolean }) => setLive(Boolean(data.live)))
      .catch(() => setLive(false));
  }, []);

  const readings = useMemo(
    () => (analysis ? interpretScores(analysis.scores) : []),
    [analysis],
  );

  const eventBrief = useMemo(() => {
    if (!analysis) return null;
    return briefEvent(
      analysis.occasion,
      analysis.scores,
      analysis.looks[0],
      analysis.skips[0],
    );
  }, [analysis]);

  const occasionLabel =
    OCCASIONS.find((item) => item.id === occasion)?.label ?? occasion;

  const runTryOn = async (look: LookRecommendation) => {
    if (!body) {
      setSelected(look);
      setStep("body");
      return;
    }
    setSelected(look);
    setBusy(true);
    setError(null);
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
      dressedFor.current = `${look.garment.id}:${body.preview}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try-on failed");
    } finally {
      setBusy(false);
    }
  };

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
      const top = json.looks[0] ?? null;
      setSelected(top);
      setTryOnUrl(null);
      dressedFor.current = null;
      setStep("looks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("face");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (step !== "looks" || !body || !selected) return;
    const key = `${selected.garment.id}:${body.preview}`;
    if (dressedFor.current === key) return;
    dressedFor.current = key;
    void runTryOn(selected);
    // Dress the chosen look onto the body as soon as the scan lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, body, selected?.garment.id]);

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
                .filter((item) => item !== "home" && item !== "tryon" && item !== "cart")
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
                  Sit close until chin-to-hairline fills the oval. After this we take a
                  shoulders shot so we can put the {occasionLabel.toLowerCase()} look on you.
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
                      onClick={() => setStep("body")}
                      className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink"
                    >
                      Next: body photo
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === "body" ? (
              <div className="space-y-4">
                <h2 className="font-display text-4xl">Now the body the clothes go on.</h2>
                <p className="text-white/60">
                  Shoulders to hip, facing the camera. We scan the face, then dress this
                  frame for your {occasionLabel.toLowerCase()}.
                </p>
                <Capture
                  mode="body"
                  onCapture={(file, preview) => setBody({ file, preview })}
                  onSkipFile={(file, preview) => setBody({ file, preview })}
                />
                {body && face ? (
                  <button
                    type="button"
                    onClick={() => void runAnalyze()}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink"
                  >
                    Read my skin and dress me for {occasionLabel}
                  </button>
                ) : null}
              </div>
            ) : null}

            {step === "analyze" ? (
              <div className="glass rounded-3xl p-8">
                <p className="pill">YouCam Skin Analysis → cloth-v3</p>
                <h2 className="mt-4 font-display text-4xl">
                  Reading the face, then dressing you for {occasionLabel}.
                </h2>
                <p className="mt-3 text-white/60">
                  Scores first, in words you can use. Then the keeper look is rendered on
                  your body — not on a model.
                </p>
              </div>
            ) : null}

            {step === "looks" && analysis && eventBrief ? (
              <ResultsPanel
                analysis={analysis}
                readings={readings}
                eventBrief={eventBrief}
                selected={selected}
                hasBody={Boolean(body)}
                dressing={busy}
                onSelect={(look) => {
                  setSelected(look);
                  setTryOnUrl(null);
                  dressedFor.current = null;
                }}
                onDress={(look) => void runTryOn(look)}
                onCart={() => setCartOpen(true)}
                total={total}
              />
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
              occasionLabel={occasionLabel}
            />
            {error ? (
              <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}
          </aside>
        </main>
      ) : null}

      {cartOpen && selected ? (
        <Cart look={selected} total={total} onClose={() => setCartOpen(false)} />
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
          Scores in plain words. Then the clothes go on your body for the room you
          are actually walking into — interview, date, wedding, not a catalog.
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
      </div>
      <div className="glass relative overflow-hidden rounded-[32px] p-6 shadow-glow">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          In words, not just numbers
        </p>
        <p className="mt-4 font-display text-2xl">Visible flush today</p>
        <p className="mt-2 text-sm text-white/60">
          Redness 48. Hot pink will look like more flush, not more style. For an
          interview we dress you in ivory or sage, on your body.
        </p>
      </div>
    </section>
  );
}

function ResultsPanel({
  analysis,
  readings,
  eventBrief,
  selected,
  hasBody,
  dressing,
  onSelect,
  onDress,
  onCart,
  total,
}: {
  analysis: AnalyzeResponse;
  readings: SkinReading[];
  eventBrief: ReturnType<typeof briefEvent>;
  selected: LookRecommendation | null;
  hasBody: boolean;
  dressing: boolean;
  onSelect: (look: LookRecommendation) => void;
  onDress: (look: LookRecommendation) => void;
  onCart: () => void;
  total: number;
}) {
  const focus = readings.filter((item) => item.band === "focus").slice(0, 3);
  const rest = readings.filter((item) => item.band !== "focus").slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <p className="pill">Skin report, in English</p>
        <h2 className="mt-3 font-display text-4xl">What the scan actually means</h2>
        <p className="mt-3 text-white/65">{overallReading(analysis.scores)}</p>
        {analysis.scores.skinAge ? (
          <p className="mt-2 text-sm text-white/45">
            Skin age {analysis.scores.skinAge} — a YouCam estimate, not your birthday.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4">
        {readings.slice(0, 6).map((item) => (
          <Gauge
            key={item.key}
            label={item.label}
            value={item.score}
            accent={item.band === "focus" ? "#fb7185" : item.band === "watch" ? "#fbbf24" : "#5CB8FF"}
          />
        ))}
      </div>

      <div className="space-y-3">
        {(focus.length ? focus : readings.slice(0, 3)).map((item) => (
          <article
            key={item.key}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium">
                {item.headline}{" "}
                <span className="text-white/40">· {item.label} {item.score}</span>
              </p>
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                {item.band === "focus" ? "Dress around this" : item.band}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/65">{item.meaning}</p>
            <p className="mt-2 text-sm text-sky-200/90">{item.forClothes}</p>
          </article>
        ))}
      </div>

      {rest.length && focus.length ? (
        <p className="text-xs text-white/40">
          Also fine today:{" "}
          {rest.map((item) => `${item.label} ${item.score}`).join(" · ")}
        </p>
      ) : null}

      <div className="glass rounded-3xl p-5">
        <p className="pill">Mini demo · {eventBrief.label}</p>
        <h3 className="mt-3 font-display text-3xl">
          Walking into {eventBrief.label.toLowerCase()}
        </h3>
        <p className="mt-2 text-sm text-white/55">
          {eventBrief.room}. {eventBrief.lighting}.
        </p>
        <ol className="mt-5 space-y-3 text-sm">
          <li className="rounded-xl bg-black/25 px-3 py-3">
            <span className="text-white/40">1 · Read</span>
            <p className="mt-1">{readings[0]?.headline ?? "Skin state captured."} {readings[0]?.meaning}</p>
          </li>
          <li className="rounded-xl bg-black/25 px-3 py-3">
            <span className="text-white/40">2 · Refuse</span>
            <p className="mt-1">
              {analysis.skips[0]
                ? `Skip ${analysis.skips[0].garment.name}. ${analysis.skips[0].reasons[0]}`
                : "Nothing is a hard skip. We still pick the quietest match for the room."}
            </p>
          </li>
          <li className="rounded-xl bg-black/25 px-3 py-3">
            <span className="text-white/40">3 · Dress you</span>
            <p className="mt-1">{eventBrief.story}</p>
          </li>
        </ol>
        {selected ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onDress(selected)}
              disabled={dressing || !hasBody}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
            >
              {dressing
                ? "Putting the look on you…"
                : hasBody
                  ? `Put ${selected.garment.name} on my skin`
                  : "Need a body photo first"}
            </button>
            <button
              type="button"
              onClick={onCart}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm"
            >
              Add look + care · ${total}
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm uppercase tracking-[0.16em] text-white/45">
          Wear for {eventBrief.label.toLowerCase()}
        </h3>
        {analysis.looks.map((look) => (
          <button
            key={look.garment.id}
            type="button"
            onClick={() => onSelect(look)}
            className={`flex w-full gap-3 rounded-2xl border p-3 text-left ${
              selected?.garment.id === look.garment.id
                ? "border-sky-300/50 bg-sky-300/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={look.garment.image}
              alt=""
              className="h-16 w-16 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{look.garment.name}</p>
              <p className="text-sm text-white/55">{look.reasons[0]}</p>
            </div>
            <span className="text-sm text-sky-200">{look.score}</span>
          </button>
        ))}
      </div>

      {analysis.skips.length ? (
        <div className="space-y-3">
          <h3 className="text-sm uppercase tracking-[0.16em] text-rose-200/80">
            Do not wear these to {eventBrief.label.toLowerCase()}
          </h3>
          {analysis.skips.map((look) => (
            <div
              key={look.garment.id}
              className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={look.garment.image}
                alt=""
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div>
                <p className="font-medium">{look.garment.name}</p>
                <p className="text-sm text-white/55">{look.reasons[0]}</p>
              </div>
            </div>
          ))}
        </div>
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
  occasionLabel,
}: {
  face?: string;
  body?: string;
  selected: LookRecommendation | null;
  tryOnUrl: string | null;
  busy: boolean;
  step: Step;
  occasionLabel: string;
}) {
  const demo = tryOnUrl?.startsWith("demo://");
  const liveTryOn = tryOnUrl && !demo ? tryOnUrl : null;
  const image = liveTryOn || body || face;

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
        {demo && selected && body ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={body} alt="" className="h-full w-full object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.garment.image}
              alt=""
              className="absolute inset-x-[12%] bottom-[8%] top-[28%] object-contain opacity-90 mix-blend-normal"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-sm">Preview on you · {selected.garment.name}</p>
              <p className="text-xs text-white/60">
                Live cloth-v3 replaces this overlay with YouCam’s wear image.
              </p>
            </div>
          </div>
        ) : null}
        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-black/50 text-sm">
            {step === "analyze"
              ? "Running Skin AI…"
              : `Dressing you for ${occasionLabel}…`}
          </div>
        ) : null}
        {liveTryOn && selected ? (
          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] uppercase tracking-[0.14em]">
            On your skin · {occasionLabel}
          </div>
        ) : null}
      </div>
      {selected ? (
        <div className="border-t border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">
            Why this, on this face, for {occasionLabel}
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
