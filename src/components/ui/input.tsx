import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 rounded-md border-[1.5px] bg-input font-sans transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:border-primary-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-primary-50/10 dark:placeholder:text-primary-50 dark:focus-visible:border-neutral-500 dark:aria-invalid:border-destructive/50",
  {
    variants: {
      size: {
        default: "h-9 py-1 text-sm file:h-7 file:text-sm file:font-medium",
        xs: "h-6 py-0.5 text-xs file:h-4 file:text-xs",
        sm: "h-8 py-1 text-sm file:h-6 file:text-xs",
        lg: "h-10 py-2 text-sm file:h-8 file:text-sm",
        kuzafy: "h-12 py-3 text-base file:h-9 file:text-sm",
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
    xs: { base: 8, icon: 28 },
    sm: { base: 10, icon: 32 },
    default: { base: 10, icon: 36 },
    lg: { base: 12, icon: 40 },
    kuzafy: { base: 16, icon: 48 },
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
        <span className="absolute left-3 flex items-center text-muted-foreground">
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
        <span className="absolute right-3 flex items-center text-muted-foreground">
          {rightIcon}
        </span>
      )}
    </div>
  );
}

export { Input, inputVariants };
