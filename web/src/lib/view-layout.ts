export type ViewLayout = "cards" | "list" | "horizontal";

export const VIEW_LAYOUT_OPTIONS: { id: ViewLayout; label: string; shortLabel: string }[] = [
  { id: "cards", label: "Card view", shortLabel: "Cards" },
  { id: "list", label: "List view", shortLabel: "List" },
  { id: "horizontal", label: "Horizontal layout", shortLabel: "Row" },
];

export function isViewLayout(value: string | null | undefined): value is ViewLayout {
  return value === "cards" || value === "list" || value === "horizontal";
}

export function readStoredViewLayout(scope: string): ViewLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(`brp-view-layout:${scope}`);
    return isViewLayout(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeViewLayout(scope: string, layout: ViewLayout): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`brp-view-layout:${scope}`, layout);
  } catch {
    // Ignore storage failures.
  }
}

export function defaultViewLayoutForViewport(): ViewLayout {
  if (typeof window === "undefined") return "cards";
  return window.matchMedia("(max-width: 639px)").matches ? "list" : "cards";
}

export function viewLayoutContainerClass(
  layout: ViewLayout,
  cardsGridClass = "grid gap-4 sm:grid-cols-2"
): string {
  if (layout === "list") return "flex flex-col gap-3";
  if (layout === "horizontal") {
    return "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
  }
  return cardsGridClass;
}

export function viewLayoutItemClass(layout: ViewLayout, horizontalWidth = "w-[min(85vw,18rem)]"): string {
  if (layout === "horizontal") return `${horizontalWidth} shrink-0 snap-start`;
  if (layout === "list") return "w-full";
  return "";
}
