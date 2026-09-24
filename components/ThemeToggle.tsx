"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";
import { THEME_STORAGE_KEY } from "@/lib/theme-script";

function getEffectiveTheme(): "light" | "dark" {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    setTheme(getEffectiveTheme());
  }, []);

  function toggle() {
    const current = theme ?? getEffectiveTheme();
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — theme just won't persist across reloads.
    }
    setTheme(next);
  }

  return (
    <button type="button" className="iconbtn" aria-label="切換深色模式" onClick={toggle}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
