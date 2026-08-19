/**
 * @fileoverview Theme toggle switch component for toggling light and dark modes.
 */

import * as React from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";

/**
 * Animated toggle button switching between light and dark visual themes.
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
      <button
        onClick={() => setIsDark(!isDark)}
        className="relative h-9 w-16 overflow-hidden rounded-full border-input bg-muted/50 p-0"
      >
        <div className="flex w-full items-center justify-between px-2 opacity-40">
          <IconSun className="size-3" />
          <IconMoon className="size-3" />
        </div>
        <div className="absolute top-1 left-1 flex size-7 items-center justify-center rounded-full border-input bg-background shadow-sm">
          <IconSun className="h-4 w-4 text-primary" />
        </div>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const setIsDark = (val: boolean) => setTheme(val ? "dark" : "light");

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="relative h-9 w-16 overflow-hidden rounded-full border border-input bg-muted/50 p-0 transition-colors duration-300 hover:bg-muted"
    >
      <div className="flex w-full items-center justify-between px-2 opacity-40">
        <IconSun className="size-3" />
        <IconMoon className="size-3" />
      </div>

      <div
        className={`absolute top-1 left-1 flex size-7 items-center justify-center rounded-full border bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDark ? "translate-x-7" : "translate-x-0"} `}
      >
        {isDark ? (
          <IconMoon className="h-4 w-4 text-primary" />
        ) : (
          <IconSun className="h-4 w-4 text-primary" />
        )}
      </div>
    </button>
  );
}
