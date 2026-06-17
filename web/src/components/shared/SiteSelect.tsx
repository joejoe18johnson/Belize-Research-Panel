"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { siteSelectTriggerClass, siteSelectTriggerCompactClass } from "@/lib/site-controls";

export type SiteSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 0 1.42l-7.25 7.25a1 1 0 0 1-1.42 0l-3.25-3.25a1 1 0 1 1 1.42-1.42l2.54 2.54 6.54-6.54a1 1 0 0 1 1.42 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function optionsFromSelectChildren(children: ReactNode): SiteSelectOption[] {
  const options: SiteSelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return;
    const props = child.props as {
      value?: string | number;
      children?: ReactNode;
      disabled?: boolean;
    };
    options.push({
      value: String(props.value ?? ""),
      label: String(props.children ?? ""),
      disabled: props.disabled,
    });
  });

  return options;
}

export function mapStringOptions(values: readonly string[], emptyLabel = "—"): SiteSelectOption[] {
  return values.map((value) => ({
    value,
    label: value || emptyLabel,
  }));
}

export type SiteSelectMenuPlacement = "auto" | "top" | "bottom";

function usePortalMenuPosition(
  open: boolean,
  rootRef: React.RefObject<HTMLDivElement | null>,
  menuRef: React.RefObject<HTMLUListElement | null>,
  placement: SiteSelectMenuPlacement,
  optionCount: number
) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open) {
      setStyle({ visibility: "hidden" });
      return;
    }

    let frameId = 0;

    const update = () => {
      const trigger = rootRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 4;
      const menuHeight = menuRef.current?.offsetHeight ?? optionCount * 42 + 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp =
        placement === "top" ||
        (placement === "auto" && spaceBelow < menuHeight && spaceAbove >= spaceBelow);

      const base: CSSProperties = {
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 72),
        minWidth: rect.width,
        zIndex: 10000,
        visibility: "visible",
      };

      if (openUp) {
        setStyle({
          ...base,
          bottom: window.innerHeight - rect.top + gap,
          maxHeight: Math.max(spaceAbove, 120),
        });
      } else {
        setStyle({
          ...base,
          top: rect.bottom + gap,
          maxHeight: Math.max(spaceBelow, 120),
        });
      }
    };

    update();
    frameId = window.requestAnimationFrame(update);

    const menu = menuRef.current;
    const observer =
      menu && typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (menu && observer) observer.observe(menu);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, placement, optionCount, rootRef, menuRef]);

  return style;
}

export function SiteSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
  compact = false,
  error = false,
  menuPlacement = "auto",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SiteSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  compact?: boolean;
  error?: boolean;
  menuPlacement?: SiteSelectMenuPlacement;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const menuStyle = usePortalMenuPosition(open, rootRef, menuRef, menuPlacement, options.length);
  const selected = options.find((option) => option.value === value);
  const display = selected?.label ?? placeholder;
  const isPlaceholder = !selected;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerClass = `${compact ? siteSelectTriggerCompactClass : siteSelectTriggerClass} ${
    error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
  }`;

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen((current) => !current)}
        className={triggerClass}
      >
        <span className={`truncate ${isPlaceholder ? "text-zinc-500" : "text-zinc-900"}`}>{display}</span>
        <ChevronIcon open={open} />
      </button>

      {open
        ? createPortal(
            <ul
              ref={menuRef}
              id={listboxId}
              role="listbox"
              style={menuStyle}
              className="overflow-auto rounded-xl border border-teal-100 bg-white py-1 shadow-lg shadow-teal-950/10"
            >
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <li key={`${option.value}::${option.label}`} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={option.disabled}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "bg-teal-700 text-white"
                          : "text-zinc-800 hover:bg-teal-50 hover:text-teal-900"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {active ? <CheckIcon /> : <span className="w-4 shrink-0" aria-hidden />}
                      <span className="truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}

export function SiteSelectField({
  error,
  className = "",
  children,
  value,
  onChange,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
  error?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = optionsFromSelectChildren(children);

  return (
    <SiteSelect
      {...props}
      value={value}
      onChange={onChange}
      options={options}
      className={className}
      error={Boolean(error)}
    />
  );
}
