"use client";

import { formatHeadingCase } from "@/lib/sentence-case";

export function SurveyOptionListEditor({
  options,
  onChange,
  multipleAnswers,
}: {
  options: string[];
  onChange: (options: string[]) => void;
  multipleAnswers?: boolean;
}) {
  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    onChange(next);
  };

  const addOption = () => {
    onChange([...options, `Option ${options.length + 1}`]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    onChange(options.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveOption = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
            {formatHeadingCase("Answer choices")}
          </label>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            {multipleAnswers
              ? "Respondents can check more than one option."
              : "Add each choice on its own line — drag-free editing, one field per option."}
          </p>
        </div>
        <button
          type="button"
          onClick={addOption}
          className="inline-flex min-h-9 items-center rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-100"
        >
          + Add option
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {options.map((option, index) => (
          <li key={`option-${index}`} className="flex items-center gap-2">
            <span className="flex h-9 w-8 shrink-0 items-center justify-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              {index + 1}.
            </span>
            <input
              value={option}
              onChange={(event) => updateOption(index, event.target.value)}
              placeholder={`Option ${index + 1}`}
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
            />
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => moveOption(index, -1)}
                disabled={index === 0}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-teal-800 dark:text-teal-200 disabled:opacity-30"
                aria-label={`Move option ${index + 1} up`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveOption(index, 1)}
                disabled={index === options.length - 1}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-teal-800 dark:text-teal-200 disabled:opacity-30"
                aria-label={`Move option ${index + 1} down`}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30"
                aria-label={`Remove option ${index + 1}`}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
