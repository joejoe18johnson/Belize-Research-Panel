/** Instantly put the visible viewport at the top of the page or a section. */

const STICKY_GAP_PX = 8;

export function measureStickyChromeHeight(exclude?: HTMLElement | null): number {
  if (typeof document === "undefined") return 0;
  let height = 0;
  let layers = 0;
  document.querySelectorAll<HTMLElement>("[data-sticky-chrome]").forEach((node) => {
    if (exclude && (node === exclude || exclude.contains(node))) return;
    height += node.getBoundingClientRect().height;
    layers += 1;
  });
  return height + layers * STICKY_GAP_PX;
}

export function syncStickyChromeOffsets() {
  if (typeof document === "undefined") return;
  const header = document.querySelector<HTMLElement>("[data-sticky-chrome='header']");
  const progress = document.querySelector<HTMLElement>("[data-sticky-chrome='progress']");
  const root = document.documentElement;
  if (header) {
    root.style.setProperty("--brp-header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
  }
  if (progress) {
    root.style.setProperty("--brp-progress-height", `${Math.ceil(progress.getBoundingClientRect().height)}px`);
  }
}

export function observeStickyChrome(): () => void {
  if (typeof window === "undefined") return () => {};

  const observer = new ResizeObserver(() => syncStickyChromeOffsets());
  const observed = new Set<Element>();

  const watch = () => {
    document.querySelectorAll<HTMLElement>("[data-sticky-chrome]").forEach((node) => {
      if (observed.has(node)) return;
      observer.observe(node);
      observed.add(node);
    });
    syncStickyChromeOffsets();
  };

  watch();
  window.addEventListener("resize", watch);
  window.addEventListener("orientationchange", watch);

  return () => {
    observer.disconnect();
    window.removeEventListener("resize", watch);
    window.removeEventListener("orientationchange", watch);
  };
}

export function scrollViewportToTop() {
  if (typeof window === "undefined") return;

  const reset = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll<HTMLElement>("main, [data-scroll-root]").forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 1) {
        el.scrollTop = 0;
      }
    });
  };

  reset();
  requestAnimationFrame(() => {
    reset();
    requestAnimationFrame(reset);
  });
}

export function scrollElementToTop(el: HTMLElement) {
  if (typeof window === "undefined") return;

  syncStickyChromeOffsets();
  const offset = measureStickyChromeHeight(el);
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "auto" });

  const scrollRoot = el.closest<HTMLElement>("[data-scroll-root]");
  if (scrollRoot && scrollRoot.scrollHeight > scrollRoot.clientHeight + 1) {
    const rootTop = scrollRoot.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    scrollRoot.scrollTop += elTop - rootTop - offset;
  }

  if (typeof el.focus === "function") {
    try {
      el.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
  }
}

export function scrollToFirstElementById(ids: string[]) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) {
      scrollElementToTop(el);
      return true;
    }
  }
  scrollViewportToTop();
  return false;
}
