import { cn } from "@/lib/utils";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { IconChevronDown } from "@tabler/icons-react";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "flex flex-col border-b border-border/40 last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-center justify-between py-1.5 px-2 text-xs font-medium text-foreground transition-all outline-none hover:bg-muted/60 rounded-xs cursor-pointer select-none [&[data-panel-open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <IconChevronDown
          size={12}
          className="shrink-0 text-muted-foreground transition-transform duration-150"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-xs transition-all data-[panel-open]:animate-in data-[panel-open]:fade-in data-[panel-closed]:animate-out data-[panel-closed]:fade-out",
        className,
      )}
      {...props}
    >
      <div className="pt-0.5 pb-1 px-1">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
