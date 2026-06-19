"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

/** Injects theme init during SSR stream — avoids React 19 script-in-component warnings. */
export function ThemeInitScript() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
  });

  return null;
}
