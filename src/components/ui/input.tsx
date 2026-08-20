import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-border bg-input font-sans text-foreground transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive",
  {
    variants: {
      size: {
        default: "h-8 px-2.5 py-1 text-xs file:h-6 file:text-xs",
        xs: "h-6 px-2 py-0.5 text-[11px] file:h-4 file:text-[11px]",
        sm: "h-7 px-2.5 py-1 text-xs file:h-5 file:text-xs",
        lg: "h-9 px-3 py-1.5 text-sm file:h-7 file:text-sm",
        kuzafy: "h-9 px-3 py-1.5 text-sm file:h-7 file:text-sm",
      },
    },
    defaultVariants: { size: "default" },
  },
);

export interface InputProps
  extends
    Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  size?: VariantProps<typeof inputVariants>["size"];
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Input({
  className,
  type,
  size,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  const sizePaddingPx = {
    xs: { base: 8, icon: 24 },
    sm: { base: 10, icon: 28 },
    default: { base: 10, icon: 30 },
    lg: { base: 12, icon: 34 },
    kuzafy: { base: 12, icon: 34 },
  };

  const currentSize = size ?? "default";
  const { base, icon } = sizePaddingPx[currentSize];

  const paddingStyle: React.CSSProperties = {
    paddingLeft: leftIcon ? icon : base,
    paddingRight: rightIcon ? icon : base,
  };

  const { dangerouslySetInnerHTML, ...cleanProps } = props as any;
  return (
    <div className="relative flex w-full items-center">
      {leftIcon && (
        <span className="absolute left-2.5 flex items-center text-muted-foreground [&_svg]:size-3.5">
          {leftIcon}
        </span>
      )}
      <InputPrimitive
        type={type}
        data-slot="input"
        style={paddingStyle}
        className={cn(inputVariants({ size }), className)}
        {...cleanProps}
      />
      {rightIcon && (
        <span className="absolute right-2.5 flex items-center text-muted-foreground [&_svg]:size-3.5">
          {rightIcon}
        </span>
      )}
    </div>
  );
}

export { Input, inputVariants };
