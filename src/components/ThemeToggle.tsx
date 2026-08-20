/**
 * @fileoverview Theme toggle switch component for toggling light and dark modes.
 */

import * as React from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";

/**
 * Clean, compact toggle button switching between light and dark visual themes.
 *
 * @returns Theme toggle button element
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative h-6 w-11 rounded-full border border-border bg-muted/60" />
    );
  }

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative h-6 w-11 cursor-pointer rounded-full border border-border bg-muted/60 p-0.5 transition-colors duration-150 hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring outline-none"
    >
      <div
        className={`flex size-4.5 items-center justify-center rounded-full bg-card shadow-xs transition-transform duration-150 ${
          isDark ? "translate-x-5 text-primary" : "translate-x-0 text-muted-foreground"
        }`}
      >
        {isDark ? (
          <IconMoon className="size-3" stroke={1.8} />
        ) : (
          <IconSun className="size-3" stroke={1.8} />
        )}
      </div>
    </button>
  );
}
