import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent font-sans text-[12.5px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "nordic-btn",
        secondary:
          "bg-muted/85 text-foreground border-transparent hover:bg-muted active:bg-accent",
        outline:
          "bg-card border-black/[0.08] dark:border-white/[0.1] text-foreground hover:bg-muted/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted/75 hover:text-foreground active:bg-muted",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15 hover:border-destructive/35 active:bg-destructive/20",
        link:
          "h-auto bg-transparent p-0 text-muted-foreground hover:text-foreground underline-offset-4 hover:underline",
        // Backward compatibility mappings
        shiny: "nordic-btn",
        glass:
          "bg-card/85 border-black/[0.06] dark:border-white/[0.08] text-foreground backdrop-blur-md hover:bg-muted/70",
        glassPrimary: "nordic-btn",
        success_outline:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
        destructive_outline:
          "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
        warning_outline:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
      },
      size: {
        default: "h-9 gap-1.5 px-4 text-[13px]",
        xs: "h-7 gap-1 px-2.5 text-[11.5px] rounded-lg [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3.5 text-[12.5px] rounded-xl",
        lg: "h-10 gap-2 px-5 text-[13.5px] rounded-xl [&_svg:not([class*='size-'])]:size-4",
        pill: "h-8 gap-1.5 px-4 text-[12.5px] rounded-full",
        icon: "size-8 p-0 rounded-xl",
        "icon-xs": "size-6 p-0 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 p-0 rounded-lg",
        "icon-lg": "size-9 p-0 rounded-xl [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
