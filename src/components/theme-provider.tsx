"use client";

import { ThemeProvider, ThemeProviderProps } from "next-themes";

export function ThemeSwitcher({ children, ...props }: ThemeProviderProps) {
  return <ThemeProvider {...props}>{children}</ThemeProvider>;
}
