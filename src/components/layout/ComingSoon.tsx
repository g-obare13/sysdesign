import { IconRocket } from "@tabler/icons-react";
import Sidebar from "../sidebar/Sidebar";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: ComingSoonProps) {
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 bg-background">
        <div className="relative mb-8">
          <div className="size-20 rounded-[--radius] bg-primary/10 flex items-center justify-center text-primary">
            <Icon size={40} stroke={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 size-8 rounded-[--radius] bg-card border border-border flex items-center justify-center shadow-lg">
            <IconRocket size={16} className="text-primary animate-pulse" />
          </div>
        </div>

        <h1 className="font-display text-3xl font-medium tracking-tight mb-3 text-foreground">
          {title}
        </h1>
        <p className="max-w-md mx-auto text-muted-foreground mb-10 leading-relaxed text-sm">
          {description}
        </p>

        <div className="mt-16 pt-8 border-t border-border w-full max-w-xs opacity-40">
          <div className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
            Feature in Testing
          </div>
        </div>
      </main>
    </div>
  );
}
