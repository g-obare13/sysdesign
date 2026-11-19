/**
 * @fileoverview Floating trigger button for opening the AI Architecture drawer.
 */

import { IconSparkles } from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAIDrawer, useAIKeys } from "@/store/ai.store";

export default function AIFloatingButton() {
  const { isOpen, toggle } = useAIDrawer();
  const { hasAny } = useAIKeys();

  return (
    <div
      className={cn(
        "fixed right-3 top-1/2 -translate-y-1/2 z-40 transition-all duration-150",
        isOpen
          ? "opacity-0 pointer-events-none scale-95"
          : "opacity-100 pointer-events-auto scale-100",
      )}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={toggle}
              aria-label="Open AI Assistant"
              className="nordic-btn relative size-10 rounded-2xl inline-flex items-center justify-center cursor-pointer"
            >
              <IconSparkles size={16} stroke={1.6} />
              {!hasAny && (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground/50 ring-2 ring-card" />
              )}
            </button>
          }
        />
        <TooltipContent side="left">AI Architecture</TooltipContent>
      </Tooltip>
    </div>
  );
}
