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
                "relative size-10 rounded-2xl nordic-pill text-foreground/80 hover:text-foreground hover:bg-muted transition-all cursor-pointer",
                isOpen && "text-foreground bg-muted",
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
