"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PHOTO_ID_TYPES } from "@/lib/constants";
import { useToast } from "@/components/shared/ToastProvider";

export function PhotoIdResubmitForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [photoIdType, setPhotoIdType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!photoIdType) {
      setError("Choose a photo ID type.");
      return;
    }
    if (!file) {
      setError("Upload a PNG, JPG, or PDF.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body = new FormData();
      body.set("photoIdType", photoIdType);
      body.set("photoIdFile", file);
      const response = await fetch("/api/verification/photo-id", { method: "POST", body });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        const message = data.message ?? "The document could not be submitted.";
        setError(message);
        showToast({ tone: "error", title: "Document not submitted", body: message });
        return;
      }
      showToast({
        tone: "success",
        title: "Document submitted",
        body: data.message ?? "Your new photo ID was submitted. Our team will review it.",
      });
      setFile(null);
      router.refresh();
    } catch {
      const message = "The document could not be submitted. Try again.";
      setError(message);
      showToast({ tone: "error", title: "Document not submitted", body: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-zinc-950">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Submit another document</p>
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-100" htmlFor="replacement-photo-id-type">
        Photo ID type
      </label>
      <select
        id="replacement-photo-id-type"
        value={photoIdType}
        onChange={(event) => setPhotoIdType(event.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <option value="">Select a document type</option>
        {PHOTO_ID_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-100" htmlFor="replacement-photo-id-file">
        New document
      </label>
      <input
        id="replacement-photo-id-file"
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-zinc-800 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-800 dark:text-zinc-100"
      />
      {error ? <p className="text-sm text-red-800 dark:text-red-200">{error}</p> : null}
      <button
        type="button"
        disabled={submitting}
        onClick={() => void submit()}
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-white"
      >
        {submitting ? "Submitting…" : "Submit document"}
      </button>
    </div>
  );
}
