// Fixes prototype bug #3 (§0.1): theme must be applied before first paint,
// and the toggle must work from the *effective* theme (OS or saved), not
// just a possibly-unset data-theme attribute.
export const THEME_STORAGE_KEY = "fcg-theme";

export function themeInitScript(): string {
  return `(function(){try{var v=localStorage.getItem("${THEME_STORAGE_KEY}");if(v==="light"||v==="dark"){document.documentElement.setAttribute("data-theme",v);}}catch(e){}})();`;
}
