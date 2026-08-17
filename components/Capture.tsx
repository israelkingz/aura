"use client";

import { canvasToFile, cropVideoToPortrait, prepareStill } from "@/lib/frame";
import { previewUrl } from "@/lib/compress";
import { useEffect, useRef, useState } from "react";

type CaptureProps = {
  mode: "face" | "body";
  onCapture: (file: File, preview: string) => void;
  onSkipFile: (file: File, preview: string) => void;
};

function cameraHint(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (!isLocal && window.location.protocol === "http:") {
    return "Camera is blocked on this address. Open http://localhost:3000 — not the 172.x network URL.";
  }
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Browser still has camera blocked for this site. Click the camera icon in the address bar, set it to Allow, then tap Enable camera.";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "The camera is already in use (another tab, Zoom, or Photo Booth). Close that app, then tap Enable camera.";
  }
  if (name === "NotFoundError") {
    return "No camera was found. Upload a close selfie instead.";
  }
  return "Could not start the camera. Use http://localhost:3000 and tap Enable camera, or upload a close-up selfie.";
}

async function getCamera() {
  const attempts: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 960 } } },
    { audio: false, video: { facingMode: { ideal: "user" } } },
    { audio: false, video: true },
  ];
  let last: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      last = error;
    }
  }
  throw last;
}

export function Capture({ mode, onCapture, onSkipFile }: CaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);

  const attachStream = async (stream: MediaStream) => {
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    setReady(true);
    setError(null);
  };

  const startCamera = async () => {
    setStarting(true);
    setError(null);
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await getCamera();
      await attachStream(stream);
    } catch (err) {
      setReady(false);
      setError(cameraHint(err));
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const stream = await getCamera();
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        await attachStream(stream);
      } catch (err) {
        if (!cancelled) setError(cameraHint(err));
      }
    };
    void boot();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const snap = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Wait until the live preview appears, then capture.");
      return;
    }
    const canvas = cropVideoToPortrait(video, mode);
    const file = await canvasToFile(canvas, `${mode}.jpg`);
    onCapture(file, previewUrl(file));
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.files?.[0];
    if (!raw) return;
    const file = await prepareStill(raw, mode);
    onSkipFile(file, previewUrl(file));
  };

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[3/4] w-full scale-x-[-1] object-cover"
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {mode === "face" ? (
            <div className="h-[72%] w-[78%] rounded-full border-2 border-sky-300/70 shadow-[0_0_40px_rgba(92,184,255,0.35)]" />
          ) : (
            <div className="h-[86%] w-[42%] rounded-[40%] border-2 border-violet-300/70" />
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[11px] uppercase tracking-[0.16em] text-white/70">
          <span>
            {mode === "face"
              ? "Fill the oval — chin to hairline"
              : "Shoulders to hip, facing camera"}
          </span>
          <span>{ready ? "Live" : "Standby"}</span>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void startCamera()}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/80"
        >
          {starting ? "Starting…" : ready ? "Restart camera" : "Enable camera"}
        </button>
        <button
          type="button"
          onClick={() => void snap()}
          disabled={!ready}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
        >
          Capture {mode === "face" ? "selfie" : "body"}
        </button>
        <label className="cursor-pointer rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/80">
          Upload photo
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
      </div>
    </div>
  );
}
