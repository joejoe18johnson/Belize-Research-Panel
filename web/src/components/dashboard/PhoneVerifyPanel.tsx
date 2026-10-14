"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatHeadingCase } from "@/lib/sentence-case";

type TwilioChannel = "whatsapp" | "sms";

export function PhoneVerifyPanel({
  phoneOnFile,
  status,
}: {
  phoneOnFile: string;
  status: "verified" | "under_review" | "pending_approval" | "missing" | "denied";
}) {
  const router = useRouter();
  const [twilioEnabled, setTwilioEnabled] = useState<boolean | null>(null);
  const [channel, setChannel] = useState<TwilioChannel | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/profile/phone/status", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { twilioEnabled?: boolean }) => {
        if (!cancelled) setTwilioEnabled(Boolean(data.twilioEnabled));
      })
      .catch(() => {
        if (!cancelled) setTwilioEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "verified" || status === "missing" || status === "pending_approval") {
    return null;
  }

  if (twilioEnabled === null) {
    return (
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        {formatHeadingCase("Checking phone verification options…")}
      </p>
    );
  }

  if (!twilioEnabled) {
    return (
      <p className="mt-3 text-sm text-amber-950 dark:text-amber-100">
        {formatHeadingCase(
          "Phone ownership will be confirmed automatically once WhatsApp / SMS verification is enabled. Until then, an administrator may still review your number."
        )}
      </p>
    );
  }

  const sendCode = async (preferChannel: TwilioChannel) => {
    setSending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/profile/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ preferChannel }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        channel?: TwilioChannel;
      };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not send a code.");
        return;
      }
      setChannel(data.channel ?? preferChannel);
      setMessage(data.message ?? "Code sent.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const checkCode = async () => {
    setChecking(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/profile/phone/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, channel: channel ?? "whatsapp" }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not verify that code.");
        return;
      }
      setMessage(data.message ?? "Phone verified.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-800 dark:bg-teal-950/40">
      <p className="text-sm font-semibold text-teal-950 dark:text-teal-50">
        {formatHeadingCase("Confirm this number belongs to you")}
      </p>
      <p className="text-sm text-teal-900 dark:text-teal-100">
        We will send a one-time code to <span className="font-medium">{phoneOnFile}</span> on WhatsApp
        first. If WhatsApp delivery fails, we fall back to SMS.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={sending}
          onClick={() => void sendCode("whatsapp")}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {sending && channel !== "sms" ? "Sending…" : "Send WhatsApp code"}
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => void sendCode("sms")}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-60 dark:border-teal-400 dark:bg-zinc-950 dark:text-teal-50"
        >
          {sending && channel === "sms" ? "Sending…" : "Send SMS instead"}
        </button>
      </div>
      {channel ? (
        <div className="space-y-2">
          <label htmlFor="phone-otp-code" className="block text-xs font-semibold text-teal-950 dark:text-teal-50">
            Enter code
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="phone-otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="min-h-10 w-40 rounded-lg border border-teal-300 bg-white px-3 text-sm tabular-nums text-zinc-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-teal-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="123456"
            />
            <button
              type="button"
              disabled={checking || code.length < 4}
              onClick={() => void checkCode()}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {checking ? "Checking…" : "Verify code"}
            </button>
          </div>
        </div>
      ) : null}
      {message ? <p className="text-sm text-emerald-800 dark:text-emerald-200">{message}</p> : null}
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
