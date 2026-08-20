/**
 * @fileoverview Fullscreen blocker view informing mobile users that desktop browsers are required for diagramming.
 */

import { IconDeviceDesktop, IconDeviceLaptop } from "@tabler/icons-react";

/**
 * Mobile blocker overlay component visible on small screens.
 *
 * @returns Blocker overlay element
 */
export default function MobileBlock() {
  return (
    <div className="flex lg:hidden fixed inset-0 z-[9999] flex-col items-center justify-center p-6 text-center bg-background/95 backdrop-blur-xs overflow-hidden">
      <div className="relative mb-6 flex items-center justify-center">
        <div className="size-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xs">
          <IconDeviceLaptop className="size-8 text-primary" stroke={1.5} />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 size-7 rounded-md bg-card border border-border flex items-center justify-center shadow-sm">
          <IconDeviceDesktop className="size-4 text-foreground" />
        </div>
      </div>

      <h1 className="text-lg font-semibold text-foreground mb-2 tracking-tight">
        Desktop Workspace Required
      </h1>

      <p className="text-muted-foreground text-xs max-w-xs leading-relaxed mb-8">
        SysDesign is designed for precise, dense system architecture modeling. Please access your workspace on a desktop or laptop display.
      </p>

      <div className="mt-auto pb-6">
        <span className="text-[11px] font-mono text-muted-foreground">
          sysdesign.obare27.com
        </span>
      </div>
    </div>
  );
}
