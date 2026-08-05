"use client";

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { buttonVariants } from "./button-variants";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

interface ButtonProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof ButtonPrimitive>, "variant">,
    VariantProps<typeof buttonVariants> {
  href?: string;
  icon?: React.ElementType | React.ReactNode;
  iconPlacement?: "left" | "right";
  hideIcon?: boolean;
  showLine?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      href,
      icon: Icon,
      iconPlacement = "right",
      hideIcon,
      showLine,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isIconOnly = !children && (!!Icon || loading);
    const renderIcon = !hideIcon && (!!Icon || loading);

    const renderIconContent = (icon: any, iconClassName?: string) => {
      if (loading) {
        return <Loader size="sm" className={iconClassName} />;
      }

      if (!icon) return null;

      if (React.isValidElement(icon)) return icon;

      const IconComponent = icon;
      return <IconComponent className={iconClassName} />;
    };

    const iconElement = renderIcon && (
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center",
          iconPlacement === "left" ? "mr-1" : "ml-1",
        )}
      >
        {renderIconContent(Icon, "size-4")}
      </span>
    );

    const content = isIconOnly ? (
      <span className="flex h-full w-full items-center justify-center">
        {renderIconContent(Icon, "size-5")}
      </span>
    ) : (
      <>
        {iconPlacement === "left" && iconElement}

        <span className="relative z-10 text-sm font-semibold">
          {loading ? "Saving..." : children}
        </span>

        {iconPlacement === "right" && iconElement}

        {showLine && (
          <span className="absolute -bottom-1 left-0 z-0 h-[1.5px] w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover/button:scale-x-100" />
        )}
      </>
    );

    const classes = cn(
      "group/button inline-flex items-center justify-center gap-2",
      buttonVariants({ variant, size }),
      isIconOnly && "aspect-square justify-center px-0",
      className,
    );

    if (href) {
      return (
        <Link to={href} className={classes}>
          {content}
        </Link>
      );
    }

    const { dangerouslySetInnerHTML, ...cleanProps } = props as any;

    return (
      <ButtonPrimitive
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...cleanProps}
      >
        {content}
      </ButtonPrimitive>
    );
  },
);

Button.displayName = "Button";

export { Button };
