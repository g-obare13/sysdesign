"use client";

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { IconLoader2 } from "@tabler/icons-react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button-variants";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof ButtonPrimitive>, "variant">,
    VariantProps<typeof buttonVariants> {
  tone?: "default" | "destructive";
  href?: string;
  icon?: React.ElementType | React.ReactNode;
  iconPlacement?: "left" | "right";
  hideIcon?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      tone = "default",
      href,
      icon: Icon,
      iconPlacement = "right",
      hideIcon,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isIconOnly = !children && (!!Icon || loading);
    const renderIcon = !hideIcon && !!Icon;

    const renderIconContent = (icon: unknown) => {
      if (!icon) return null;
      if (React.isValidElement(icon)) return icon;
      const IconComponent = icon as React.ElementType;
      return <IconComponent className="size-4" stroke={1.6} />;
    };

    const iconElement = renderIcon && (
      <span className="inline-flex items-center justify-center shrink-0">
        {renderIconContent(Icon)}
      </span>
    );

    const innerContent = isIconOnly ? (
      <span
        className={cn(
          "flex size-full items-center justify-center",
          loading && "invisible",
        )}
      >
        {renderIconContent(Icon)}
      </span>
    ) : (
      <span
        className={cn(
          "inline-flex items-center justify-center gap-2 leading-none",
          loading && "invisible",
        )}
      >
        {iconPlacement === "left" && iconElement}
        <span>{children}</span>
        {iconPlacement === "right" && iconElement}
      </span>
    );

    const content = (
      <>
        {innerContent}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <IconLoader2 className="size-4 animate-spin" stroke={1.8} />
          </span>
        )}
      </>
    );

    const classes = cn(buttonVariants({ variant, size }), className);

    if (href) {
      return (
        <Link
          to={href}
          data-tone={tone}
          aria-busy={loading || undefined}
          className={classes}
        >
          {content}
        </Link>
      );
    }

    const { dangerouslySetInnerHTML, ...cleanProps } = props as Record<
      string,
      unknown
    >;

    return (
      <ButtonPrimitive
        ref={ref}
        data-tone={tone}
        aria-busy={loading || undefined}
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
