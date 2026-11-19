import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-sans text-body font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "shiny-primary-btn",
        secondary:
          "bg-muted text-foreground border border-transparent hover:bg-accent",
        outline:
          "bg-card text-foreground border border-border hover:bg-muted",
        ghost:
          "bg-transparent text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15 hover:border-destructive/35",
      },
      size: {
        sm: "h-8 gap-2 px-3.5",
        default: "h-9 gap-2 px-4",
        lg: "h-10 gap-2 px-5",
        "icon-sm": "size-8 p-0",
        icon: "size-9 p-0",
        "icon-lg": "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
