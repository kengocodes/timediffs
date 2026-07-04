"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence, type Transition } from "motion/react"

import { cn } from "@/lib/utils"

const Drawer = DialogPrimitive.Root

const DrawerTrigger = DialogPrimitive.Trigger

const DrawerClose = DialogPrimitive.Close

// Animation configuration - consistent with codebase style
const DRAWER_TRANSITION: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.5,
}

const OVERLAY_TRANSITION: Transition = {
  duration: 0.2,
  ease: "easeOut",
}

interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  open?: boolean
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, open, ...props }, ref) => {
  const [drawerHeight, setDrawerHeight] = React.useState<number | undefined>(undefined)
  const [prevOpen, setPrevOpen] = React.useState(open)

  // Capture initial viewport height when drawer opens to prevent resize from keyboard
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open && typeof window !== "undefined") {
      setDrawerHeight(Math.min(window.innerHeight * 0.85, 600))
    }
  }

  return (
    <DialogPrimitive.Portal>
      <AnimatePresence>
        {open && (
          <>
            <DialogPrimitive.Overlay
              asChild
              forceMount
              key="drawer-overlay"
            >
              <motion.div
                className={cn(
                  "fixed inset-0 z-50 bg-black/50"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={OVERLAY_TRANSITION}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              ref={ref}
              asChild
              forceMount
              {...props}
              key="drawer-content"
            >
              <motion.div
                className={cn(
                  "fixed z-50 bg-white dark:bg-stone-900 shadow-lg flex flex-col",
                  "inset-x-0 bottom-0 border-t border-slate-200 dark:border-stone-700 rounded-t-[1.5rem]",
                  className
                )}
                style={{
                  height: drawerHeight ? `${drawerHeight}px` : undefined,
                  maxHeight: drawerHeight ? `${drawerHeight}px` : '85vh',
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={DRAWER_TRANSITION}
              >
                {/* Drag handle indicator */}
                <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-stone-600 mb-2 mt-3 shrink-0" />
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </>
        )}
      </AnimatePresence>
    </DialogPrimitive.Portal>
  )
})
DrawerContent.displayName = DialogPrimitive.Content.displayName

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
}

