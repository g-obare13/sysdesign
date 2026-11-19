import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 rounded-lg border border-border bg-input font-sans text-body text-foreground transition-colors duration-150 outline-none file:inline-flex file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:bg-card focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      size: {
        default: "h-9 px-3 py-2 text-body file:h-6 file:text-small",
        sm: "h-8 px-3 py-1 text-body file:h-5 file:text-small",
        lg: "h-10 px-4 py-2 text-body file:h-7 file:text-body",
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
  const { dangerouslySetInnerHTML, ...cleanProps } = props as Record<
    string,
    unknown
  >;

  return (
    <div className="relative flex w-full items-center">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 flex items-center text-muted-foreground [&_svg]:size-4">
          {leftIcon}
        </span>
      )}
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          inputVariants({ size }),
          leftIcon && "pl-9",
          rightIcon && "pr-9",
          className,
        )}
        {...cleanProps}
      />
      {rightIcon && (
        <span className="pointer-events-none absolute right-3 flex items-center text-muted-foreground [&_svg]:size-4">
          {rightIcon}
        </span>
      )}
    </div>
  );
}

export { Input, inputVariants };
