"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "../lib/cn"

const AccordionContext = React.createContext<{
  name: string
  type: "single" | "multiple"
  defaultValue?: string | string[]
}>({ name: "", type: "multiple" })

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "single" | "multiple"
    collapsible?: boolean
    defaultValue?: string | string[]
  }
>(({ className, type = "single", defaultValue, collapsible, ...props }, ref) => {
  void collapsible
  const generatedName = React.useId()
  return (
    <AccordionContext.Provider value={{ name: generatedName, type, defaultValue }}>
      <div ref={ref} className={className} {...props} />
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  HTMLDetailsElement,
  React.DetailsHTMLAttributes<HTMLDetailsElement> & { value?: string }
>(({ className, value, ...props }, ref) => {
  const ctx = React.useContext(AccordionContext)
  const isDefaultOpen = Array.isArray(ctx.defaultValue)
    ? ctx.defaultValue.includes(value || "")
    : ctx.defaultValue === value

  return (
    <details
      ref={ref}
      name={ctx.type === "single" ? ctx.name : undefined}
      open={isDefaultOpen || undefined}
      className={cn("group border-b", className)}
      {...props}
    />
  )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <summary
    ref={ref}
    className={cn(
      "flex flex-1 cursor-pointer items-center justify-between py-4 font-medium transition-all hover:underline list-none [&::-webkit-details-marker]:hidden",
      "[&>svg]:group-open:rotate-180",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
  </summary>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className="overflow-hidden text-sm"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </div>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
