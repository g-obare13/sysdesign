import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent font-sans text-xs font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary hover:bg-primary/90 active:bg-primary/80 shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-muted hover:text-foreground active:bg-muted/80",
        outline:
          "bg-transparent border-border text-foreground hover:bg-muted hover:border-border-strong active:bg-muted/80",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:border-destructive/40 active:bg-destructive/30",
        link:
          "h-auto bg-transparent p-0 text-muted-foreground hover:text-foreground underline-offset-4 hover:underline",
        // Backward compatibility mappings
        shiny:
          "bg-primary text-primary-foreground border-primary hover:bg-primary/90 active:bg-primary/80 shadow-none",
        glass:
          "bg-card/80 border-border text-foreground backdrop-blur-sm hover:bg-muted",
        glassPrimary:
          "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
        success_outline:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
        destructive_outline:
          "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
        warning_outline:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
      },
      size: {
        default: "h-8 gap-1.5 px-3 text-xs",
        xs: "h-6 gap-1 px-2 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1.5 px-2.5 text-xs",
        lg: "h-9 gap-2 px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
        pill: "h-8 gap-1.5 px-3.5 text-xs rounded-full",
        icon: "size-8 p-0",
        "icon-xs": "size-6 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 p-0",
        "icon-lg": "size-9 p-0 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
