"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminStatusPill, MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { isAuthorisedCodeUsed, type AuthorisedRegistrar } from "@/lib/authorised-registrars";
import { formatHeadingCase } from "@/lib/sentence-case";

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CopiedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function registrarStatus(row: AuthorisedRegistrar): {
  label: string;
  tone: "success" | "warning" | "neutral";
  detail: string;
} {
  if (isAuthorisedCodeUsed(row)) {
    const when = row.usedAt ? new Date(row.usedAt).toLocaleString() : "";
    const who = row.usedByEmail;
    return {
      label: "Used",
      tone: "neutral",
      detail: [when, who].filter(Boolean).join(" · "),
    };
  }
  if (!row.active) {
    return { label: "Inactive", tone: "neutral", detail: "" };
  }
  return { label: "Unused", tone: "success", detail: "" };
}

export function AdminAuthorisedRegistrarsClient({
  initialRegistrars,
}: {
  initialRegistrars: AuthorisedRegistrar[];
}) {
  const router = useRouter();
  const [registrars, setRegistrars] = useState(initialRegistrars);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    setRegistrars(initialRegistrars);
  }, [initialRegistrars]);

  const unusedCount = useMemo(
    () => registrars.filter((row) => row.active && !isAuthorisedCodeUsed(row)).length,
    [registrars]
  );
  const usedCount = useMemo(
    () => registrars.filter((row) => isAuthorisedCodeUsed(row)).length,
    [registrars]
  );

  const refreshFromResponse = (next: AuthorisedRegistrar[]) => {
    setRegistrars(next);
    router.refresh();
  };

  const copyCode = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? "" : current)), 2000);
  };

  const create = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/authorised-registrars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, notes }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        registrar?: AuthorisedRegistrar;
        message?: string;
      };
      if (!res.ok || !data.registrar) {
        setError(data.message ?? "Could not create the authorisation code.");
        return;
      }
      setName("");
      setCode("");
      setNotes("");
      setMessage(`Code ${data.registrar.code} created for ${data.registrar.name}.`);
      refreshFromResponse([...registrars, data.registrar]);
    } catch {
      setError("Network error while creating the code.");
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (id: string, active: boolean) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/authorised-registrars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      const data = (await res.json()) as { ok?: boolean; registrar?: AuthorisedRegistrar; message?: string };
      if (!res.ok || !data.registrar) {
        setError(data.message ?? "Could not update that code.");
        return;
      }
      refreshFromResponse(registrars.map((row) => (row.id === id ? data.registrar! : row)));
    } catch {
      setError("Network error while updating that code.");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this authorisation code? Existing panelists who used it will still keep the code on their record.")) {
      return;
    }
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/authorised-registrars", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not delete that code.");
        return;
      }
      refreshFromResponse(registrars.filter((row) => row.id !== id));
    } catch {
      setError("Network error while deleting that code.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageIntro
        eyebrow="Panelists"
        title={formatHeadingCase("Authorised registrars")}
        description="Give trusted people a unique code so they can register panelists after checking a photo ID in person. Each code can be used only once. Admin will see the code, whose name it belongs to, and whether it has already been used."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Unused codes" value={unusedCount} />
        <MetricCard label="Used codes" value={usedCount} />
        <MetricCard label="All codes" value={registrars.length} />
      </div>

      {error ? (
        <BrandedAlert tone="error" showIcon>
          {error}
        </BrandedAlert>
      ) : null}
      {message ? (
        <BrandedAlert tone="success" showIcon>
          {message}
        </BrandedAlert>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">
            {formatHeadingCase("Issue a new code")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            The authorised person must see a photo ID in person before giving this code to a new panelist. After it is
            used once, it cannot be used again.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Authorised person&apos;s name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Full name"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Code (optional)</span>
            <input
              value={code}
              onChange={(event) =>
                setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
              }
              maxLength={6}
              autoCapitalize="characters"
              spellCheck={false}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm uppercase tracking-widest dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Leave blank to generate"
            />
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              Exactly 6 uppercase letters or numbers, for example A7K2M9. Leave blank to generate one.
            </span>
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Internal note (optional)</span>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Relationship, location, or how they will register people"
          />
        </label>
        <button
          type="button"
          disabled={saving || !name.trim()}
          onClick={create}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create authorisation code"}
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">
            {formatHeadingCase("Issued codes")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Click a code or the copy icon to copy it. Used codes stay used even if you reactivate them.
          </p>
        </div>
        {registrars.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-600 dark:text-zinc-400">
            No codes yet. Create one for each trusted person who will check IDs in person.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Note</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrars.map((row) => {
                  const status = registrarStatus(row);
                  const used = isAuthorisedCodeUsed(row);
                  const copied = copiedId === row.id;
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-zinc-100 dark:border-zinc-800 ${
                        used ? "bg-zinc-50 text-zinc-400 dark:bg-zinc-950/60 dark:text-zinc-500" : ""
                      }`}
                    >
                      <td
                        className={`px-5 py-3 font-medium ${
                          used ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {row.name}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => void copyCode(row.code, row.id)}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 font-mono tracking-widest ${
                            used
                              ? "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
                              : "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                          }`}
                          title={copied ? "Copied" : used ? "Used code" : "Copy code"}
                          aria-label={
                            copied ? `Copied ${row.code}` : used ? `Used code ${row.code}` : `Copy code ${row.code}`
                          }
                        >
                          <span className={`[font-variant-numeric:slashed-zero] ${used ? "line-through" : ""}`}>
                            {row.code}
                          </span>
                          {copied ? <CopiedIcon /> : <CopyIcon />}
                          <span className="font-sans text-xs font-semibold tracking-normal text-zinc-500">
                            {copied ? "Copied" : used ? "Used" : <span className="sr-only">Copy</span>}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <AdminStatusPill label={status.label} tone={status.tone} />
                          {status.detail ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{status.detail}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className={`px-5 py-3 ${used ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {row.notes || "—"}
                      </td>
                      <td className={`px-5 py-3 ${used ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                        {row.createdBy ? ` · ${row.createdBy}` : ""}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyId === row.id || used}
                            onClick={() => setActive(row.id, !row.active)}
                            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            {row.active ? "Deactivate" : "Reactivate"}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => remove(row.id)}
                            className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
