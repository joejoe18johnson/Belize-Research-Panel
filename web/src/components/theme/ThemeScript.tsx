import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid a flash of the wrong theme. */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=document.documentElement;var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light"}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
