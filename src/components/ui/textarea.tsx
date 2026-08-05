import * as React from "react";
import { inputVariants } from "./input";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AutosizeTextarea } from "./autosize-textarea";

export interface TextareaProps
  extends
    React.ComponentProps<typeof AutosizeTextarea>,
    VariantProps<typeof inputVariants> {}

function Textarea({ className, size, ...props }: TextareaProps) {
  return (
    <AutosizeTextarea
      data-slot="textarea"
      className={cn(inputVariants({ size }), "p-2", className)}
      {...props}
    />
  );
}

export { Textarea };
