"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatSentenceCase } from "@/lib/sentence-case";

type PhotoIdCaptureFieldProps = {
  id?: string;
  file?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  takePhotoLabel: string;
  uploadFileLabel: string;
  clearLabel: string;
  captureTitle: string;
  captureHint: string;
  captureButtonLabel: string;
  useCameraLabel: string;
  cancelLabel: string;
  attachedLabel: (fileName: string) => string;
  cameraUnavailable: string;
};

function errorClassName(hasError: boolean): string {
  return hasError ? "rounded-lg ring-2 ring-red-500/30" : "";
}

export function PhotoIdCaptureField({
  id,
  file,
  onChange,
  error,
  takePhotoLabel,
  uploadFileLabel,
  clearLabel,
  captureTitle,
  captureHint,
  captureButtonLabel,
  useCameraLabel,
  cancelLabel,
  attachedLabel,
  cameraUnavailable,
}: PhotoIdCaptureFieldProps) {
  const generatedId = useId();
  const uploadInputId = id ?? `photo-id-upload-${generatedId}`;
  const cameraInputId = `photo-id-camera-${generatedId}`;
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCameraError("");
  };

  const openLiveCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setCameraError(cameraUnavailable);
      cameraInputRef.current?.click();
    }
  };

  const snapPhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92)
    );
    if (!blob) return;
    const captured = new File([blob], `photo-id-${Date.now()}.jpg`, { type: "image/jpeg" });
    onChange(captured);
    closeCamera();
  };

  return (
    <div className="space-y-3">
      <input
        ref={uploadInputRef}
        id={uploadInputId}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraInputRef}
        id={cameraInputId}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      <div className={`flex flex-col gap-2 sm:flex-row ${errorClassName(Boolean(error))}`}>
        <button
          type="button"
          onClick={() => void openLiveCamera()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5 8.25 5.25h7.5L17.25 7.5H19.5A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9A1.5 1.5 0 0 1 4.5 7.5h2.25Z" />
            <circle cx="12" cy="13.5" r="3.25" />
          </svg>
          {takePhotoLabel}
        </button>
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          {uploadFileLabel}
        </button>
      </div>

      {cameraError ? (
        <p className="text-sm text-amber-900 dark:text-amber-100">{cameraError}</p>
      ) : null}

      {file ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-800 dark:bg-teal-950/40">
          <p className="text-sm font-medium text-teal-950 dark:text-teal-50">{attachedLabel(file.name)}</p>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="mt-2 max-h-48 w-full rounded-lg object-contain bg-white dark:bg-zinc-900"
            />
          ) : null}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 text-sm font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-950 dark:text-teal-100"
          >
            {clearLabel}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-200" role="alert">
          {formatSentenceCase(error)}
        </p>
      ) : null}

      {cameraOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={captureTitle}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-xl"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-base font-semibold">{captureTitle}</p>
              <p className="mt-1 text-sm text-zinc-300">{captureHint}</p>
            </div>
            <div className="relative aspect-[4/3] bg-black">
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-white/70" />
            </div>
            <div className="flex flex-col gap-2 p-4 sm:flex-row">
              <button
                type="button"
                onClick={() => void snapPhoto()}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500"
              >
                {captureButtonLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeCamera();
                  cameraInputRef.current?.click();
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10"
              >
                {useCameraLabel}
              </button>
              <button
                type="button"
                onClick={closeCamera}
                className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-zinc-300 hover:bg-white/10"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
