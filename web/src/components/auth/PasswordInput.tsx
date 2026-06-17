"use client";

import { forwardRef, useRef, useState, type InputHTMLAttributes } from "react";

const inputClass =
  "w-full h-12 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 pr-11 text-sm text-zinc-900 dark:text-zinc-100 transition hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 dark:bg-zinc-950 disabled:text-zinc-500 dark:text-zinc-400 dark:text-zinc-500";
const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500/20";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none h-5 w-5" stroke="currentColor" strokeWidth="1.75">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none h-5 w-5" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { error?: string }
>(function PasswordInput(
  {
    error,
    className = "",
    id,
    autoComplete,
    onChange,
    onInput,
    ...props
  },
  ref
) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const toggleVisibility = () => {
    setVisible((prev) => {
      const next = !prev;
      const input = inputRef.current;
      if (input) {
        input.type = next ? "text" : "password";
      }
      return next;
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="relative">
      <input
        {...props}
        ref={setRefs}
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        onChange={onChange}
        onInput={onInput}
        className={`${inputClass} ${error ? errorInputClass : ""} ${className}`}
        aria-invalid={error ? "true" : undefined}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 z-10 flex min-h-12 min-w-12 touch-manipulation items-center justify-center rounded-r-lg text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 transition hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-800 dark:text-zinc-200 active:bg-zinc-100 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-600/30"
        onClick={toggleVisibility}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
});
