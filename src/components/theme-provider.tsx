"use client";

import { ThemeProvider, ThemeProviderProps } from "next-themes";

const THEME_STORAGE_KEY = "theme";

export function ThemeSwitcher({ children, ...props }: ThemeProviderProps) {
  return (
    <ThemeProvider
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      enableColorScheme
      {...props}
    >
      {children}
    </ThemeProvider>
  );
}
