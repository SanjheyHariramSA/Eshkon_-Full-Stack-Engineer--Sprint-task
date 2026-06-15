/**
 * Inline, render-blocking script that applies the persisted (or system) theme
 * before first paint, eliminating the dark-mode flash. Kept tiny and dependency
 * free; the toggle lives in ThemeToggle.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark')}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
