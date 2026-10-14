"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatHeadingCase } from "@/lib/sentence-case";

type TwilioChannel = "whatsapp" | "sms";

export function PhoneChangeOtpPanel({ pendingPhone }: { pendingPhone: string }) {
  const router = useRouter();
  const [channel, setChannel] = useState<TwilioChannel | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const resend = async (preferChannel: TwilioChannel) => {
    setSending(true);
    setError("");
    setMessage("");
    try {
      // Pending phone is already stored; re-send by calling send-code with empty local would fail.
      // Use check path's sibling: phone-change/send-code needs the number parts.
      // Parse "+501 612-3456" style for resend via a dedicated resend using status pending.
      const res = await fetch("/api/profile/phone-change/resend-code", {
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
      const res = await fetch("/api/profile/phone-change/check-code", {
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
      setMessage(data.message ?? "Phone updated.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-950/40">
      <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
        {formatHeadingCase("Confirm your new number")}
      </p>
      <p className="text-sm text-amber-900 dark:text-amber-100">
        Enter the code sent to <span className="font-medium">{pendingPhone}</span> to finish the change.
        No administrator approval is needed once the code succeeds.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={sending}
          onClick={() => void resend("whatsapp")}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Resend WhatsApp code"}
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => void resend("sms")}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-60 dark:border-teal-400 dark:bg-zinc-950 dark:text-teal-50"
        >
          Resend by SMS
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="min-h-10 w-40 rounded-lg border border-amber-300 bg-white px-3 text-sm tabular-nums text-zinc-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-amber-700 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="123456"
          aria-label="Verification code"
        />
        <button
          type="button"
          disabled={checking || code.length < 4}
          onClick={() => void checkCode()}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {checking ? "Checking…" : "Confirm number"}
        </button>
      </div>
      {message ? <p className="text-sm text-emerald-800 dark:text-emerald-200">{message}</p> : null}
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
