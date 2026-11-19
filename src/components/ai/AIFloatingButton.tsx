/**
 * @fileoverview Floating trigger button for opening the AI Architecture drawer.
 */

import { IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
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
        "fixed right-3 top-1/2 -translate-y-1/2 z-40 transition-opacity duration-150",
        isOpen
          ? "opacity-0 pointer-events-none"
          : "opacity-100 pointer-events-auto",
      )}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={toggle}
              aria-label="Open AI Assistant"
              className="relative nordic-panel"
            >
              <IconSparkles size={16} stroke={1.6} />
              {!hasAny && (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground/60" />
              )}
            </Button>
          }
        />
        <TooltipContent side="left">AI architecture</TooltipContent>
      </Tooltip>
    </div>
  );
}
