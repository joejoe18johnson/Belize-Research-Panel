import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid a flash of the wrong theme. */
const THEME_INIT_CODE = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=document.documentElement;var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light"}catch(e){}})();`;

export function ThemeScript() {
  return (
    <Script id="brp-theme-init" strategy="beforeInteractive">
      {THEME_INIT_CODE}
    </Script>
  );
}
