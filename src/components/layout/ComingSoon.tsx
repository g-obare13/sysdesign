/**
 * @fileoverview Placeholder landing layout for in-development features.
 */

import { IconSparkles } from "@tabler/icons-react";
import Sidebar from "@/components/sidebar/Sidebar";

interface ComingSoonProps {
  /** Title of the upcoming feature */
  title: string;
  /** Detailed description of the functionality */
  description: string;
  /** Primary icon component */
  icon: React.ElementType;
}

/**
 * Placeholder view rendered on work-in-progress routes.
 *
 * @param props - ComingSoonProps
 * @returns ComingSoon view component
 */
export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: ComingSoonProps) {
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 bg-background">
        <div className="relative mb-6">
          <div className="size-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Icon size={32} stroke={1.5} />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-md bg-card border border-border flex items-center justify-center shadow-sm">
            <IconSparkles size={12} className="text-primary" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-foreground tracking-tight mb-2">
          {title}
        </h1>
        <p className="max-w-md mx-auto text-xs text-muted-foreground mb-8 leading-relaxed">
          {description}
        </p>

        <div className="pt-4 border-t border-border/40 w-full max-w-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Feature in development
          </span>
        </div>
      </main>
    </div>
  );
}
