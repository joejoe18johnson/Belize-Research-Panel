/** Instantly put the visible viewport at the top of the page or a section. */

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

  const header = document.querySelector("header");
  const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
  const y = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
  window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "auto" });

  const scrollRoot = el.closest<HTMLElement>("[data-scroll-root], main");
  if (scrollRoot && scrollRoot.scrollHeight > scrollRoot.clientHeight + 1) {
    const rootTop = scrollRoot.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    scrollRoot.scrollTop += elTop - rootTop - 12;
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
