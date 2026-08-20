/**
 * @fileoverview Floating trigger button for opening the AI Chat Drawer.
 * Positioned on the right middle of the screen matching the canvas controls aesthetic.
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
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 animate-in fade-in duration-200">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              onClick={toggle}
              variant="outline"
              size="icon-lg"
              className={cn(
                "relative rounded-full shadow-xs bg-neutral-950 border border-border hover:bg-neutral-950 transition-colors cursor-pointer text-neutral-50",
                isOpen && "border-primary/50 text-primary bg-neutral-950/10",
              )}
            >
              <IconSparkles
                size={15}
                stroke={1.5}
                className={cn(
                  "transition-transform duration-200",
                  isOpen && "text-primary",
                )}
              />
              {!hasAny && (
                <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary ring-1 ring-background animate-pulse" />
              )}
            </Button>
          }
        />
        <TooltipContent side="left">
          {isOpen ? "Close AI Assistant" : "AI Assistant"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
