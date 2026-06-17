"use client";

export function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-1.5 max-h-36 space-y-0.5 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2">
        {options.length === 0 ? (
          <p className="px-2 py-1 text-xs text-zinc-400">None</p>
        ) : (
          options.map((option) => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-teal-50/60"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selected.filter((v) => v !== option) : [...selected, option])
                  }
                  className="rounded border-zinc-300 text-teal-700"
                />
                <span className="truncate">{option}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

export function MetricCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-teal-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-l-4 border-teal-600 pl-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold text-teal-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}
