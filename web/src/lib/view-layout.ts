export type ViewLayout = "cards" | "list";

export const VIEW_LAYOUT_OPTIONS: { id: ViewLayout; label: string; shortLabel: string }[] = [
  { id: "cards", label: "Card view", shortLabel: "Cards" },
  { id: "list", label: "List view", shortLabel: "List" },
];

export function isViewLayout(value: string | null | undefined): value is ViewLayout {
  return value === "cards" || value === "list";
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
  return cardsGridClass;
}

export function viewLayoutItemClass(layout: ViewLayout, _itemWidth?: string): string {
  if (layout === "list") return "w-full";
  return "";
}
