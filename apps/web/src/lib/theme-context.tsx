"use client";

import React, { createContext, useContext, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initial);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.cookie = `fm-theme=${next};path=/;max-age=31536000;SameSite=Lax`;
      document.documentElement.dataset.theme = next === "light" ? "light" : "";
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
