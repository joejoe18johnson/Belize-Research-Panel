"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterBelizeCtvs, findDistrictForCtv } from "@/lib/constants";
import { TextInput } from "./form-ui";

export function CtvAutocomplete({
  id,
  value,
  onChange,
  onBlur,
  onSelectDistrict,
  error,
  placeholder = "Start typing a city, town, or village",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** When a known CTV is chosen, optionally set its district. */
  onSelectDistrict?: (district: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(() => filterBelizeCtvs(value, 12), [value]);

  useEffect(() => {
    setHighlight(0);
  }, [value]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const pick = (name: string) => {
    onChange(name);
    const district = findDistrictForCtv(name);
    if (district) onSelectDistrict?.(district);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <TextInput
        id={id}
        value={value}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        error={error}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so option click can register.
          window.setTimeout(() => onBlur?.(), 120);
        }}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((prev) => (prev + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(suggestions[highlight] ?? suggestions[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-teal-200 bg-white py-1 shadow-lg shadow-teal-950/10 dark:border-teal-800 dark:bg-zinc-900"
        >
          {suggestions.map((name, index) => (
            <li key={name} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                className={`flex w-full px-3 py-2 text-left text-sm ${
                  index === highlight
                    ? "bg-teal-50 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100"
                    : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => pick(name)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
