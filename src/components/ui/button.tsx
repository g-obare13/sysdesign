import * as React from "react";
import { Link } from "@tanstack/react-router";
import { type VariantProps } from "class-variance-authority";
import { IconLoader2 } from "@tabler/icons-react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

interface ButtonProps
  extends
    React.ComponentPropsWithoutRef<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  // Accepts a component type (e.g. SendIcon) OR a JSX element (e.g. <svg>...</svg>)
  icon?: React.ElementType | React.ReactElement;
  hideIcon?: boolean;
  showLine?: boolean;
  iconSide?: "left" | "right";
  loading?: boolean;
}

/**
 * Renders an icon regardless of whether it was passed as a component type
 * or as a pre-rendered JSX element. When loading, always renders the spinner.
 */
function renderIconNode(
  icon: React.ElementType | React.ReactElement | undefined,
  loading: boolean,
  className: string,
): React.ReactNode {
  if (loading) {
    return <IconLoader2 className={cn(className, "animate-spin")} />;
  }
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    return React.cloneElement(
      icon as React.ReactElement<{ className?: string }>,
      {
        className: cn(
          (icon.props as { className?: string }).className,
          className,
        ),
      },
    );
  }
  const Icon = icon as React.ElementType;
  return <Icon className={className} />;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      href,
      icon,
      hideIcon,
      showLine,
      iconSide = "left",
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const hasIcon = !hideIcon && (!!icon || loading);
    const isIconOnly = hasIcon && !children;

    const iconNode = hasIcon
      ? renderIconNode(icon, loading, "shrink-0 size-4")
      : null;

    // showLine underline decoration — only wraps children, no font changes
    const labelContent = showLine ? (
      <span className="relative z-10">
        {children}
        <span
          className="absolute -bottom-1 left-0 h-[1.5px] w-full bg-current scale-x-0 transition-transform duration-300 ease-in-out origin-left group-hover/button:scale-x-100 z-0"
          aria-hidden="true"
        />
      </span>
    ) : (
      children
    );

    let content: React.ReactNode;

    if (isIconOnly) {
      // No label — render icon directly, no slots
      content = iconNode;
    } else if (hasIcon) {
      // Icon + label: muted slot with divider, label rendered directly (no font-breaking span)
      const iconSlot = (
        <span
          aria-hidden="true"
          className={cn(
            "self-stretch flex items-center justify-center shrink-0",
            "bg-black/10 dark:bg-white/10",
            iconSide === "left"
              ? "border-r border-black/10 dark:border-white/10 px-2.5"
              : "border-l border-black/10 dark:border-white/10 px-2.5",
          )}
        >
          {iconNode}
        </span>
      );

      content =
        iconSide === "left" ? (
          <>
            {iconSlot}
            <span className="px-2.5 font-medium text-xs text-muted-background">
              {labelContent}
            </span>
          </>
        ) : (
          <>
            <span className="px-2.5 font-medium text-xs text-muted-background">
              {labelContent}
            </span>
            {iconSlot}
          </>
        );
    } else {
      // No icon — children render directly inside the button, inheriting all styles
      content = labelContent;
    }

    const combinedClassName = cn(
      buttonVariants({ variant, size, className }),
      hasIcon && !isIconOnly && "px-0 gap-0",
    );

    if (href) {
      return (
        <Link to={href} className={combinedClassName}>
          {content}
        </Link>
      );
    }

    return (
      <ButtonPrimitive
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {content}
      </ButtonPrimitive>
    );
  },
);

Button.displayName = "Button";
export { Button, buttonVariants, type ButtonProps };
