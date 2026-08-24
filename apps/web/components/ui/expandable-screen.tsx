"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

interface ExpandableScreenContextValue {
  isExpanded: boolean
  expand: () => void
  collapse: () => void
  layoutId: string
  triggerRadius: string
  contentRadius: string
  animationDuration: number
}

const ExpandableScreenContext =
  createContext<ExpandableScreenContextValue | null>(null)

function useExpandableScreen() {
  const context = useContext(ExpandableScreenContext)
  if (!context) {
    throw new Error(
      "useExpandableScreen must be used within an ExpandableScreen"
    )
  }
  return context
}

interface ExpandableScreenProps {
  children: ReactNode
  defaultExpanded?: boolean
  onExpandChange?: (expanded: boolean) => void
  layoutId?: string
  triggerRadius?: string
  contentRadius?: string
  animationDuration?: number
  lockScroll?: boolean
}

export function ExpandableScreen({
  children,
  defaultExpanded = false,
  onExpandChange,
  layoutId = "expandable-card",
  triggerRadius = "100px",
  contentRadius = "24px",
  animationDuration = 0.3,
  lockScroll = true,
}: ExpandableScreenProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const expand = () => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    setIsExpanded(true)
    onExpandChange?.(true)
  }

  const collapse = () => {
    setIsExpanded(false)
    onExpandChange?.(false)
    window.setTimeout(() => previouslyFocused.current?.focus(), 0)
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (lockScroll) {
      document.body.style.overflow = isExpanded ? "hidden" : "unset"
    }
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isExpanded, lockScroll])

  useEffect(() => {
    if (!isExpanded) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        collapse()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    const focusTimer = window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(
          '[data-expandable-screen-content] button, [data-expandable-screen-content] input, [data-expandable-screen-content] textarea, [data-expandable-screen-content] select, [data-expandable-screen-content] a[href]'
        )
        ?.focus()
    }, 0)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [isExpanded])

  return (
    <ExpandableScreenContext.Provider
      value={{
        isExpanded,
        expand,
        collapse,
        layoutId,
        triggerRadius,
        contentRadius,
        animationDuration,
      }}
    >
      {children}
    </ExpandableScreenContext.Provider>
  )
}

interface ExpandableScreenTriggerProps {
  children: ReactNode
  className?: string
}

export function ExpandableScreenTrigger({
  children,
  className = "",
}: ExpandableScreenTriggerProps) {
  const { isExpanded, expand, layoutId, triggerRadius } =
    useExpandableScreen()

  return (
    <AnimatePresence initial={false}>
      {!isExpanded && (
        <motion.div className={`relative inline-block ${className}`}>
          <motion.div
            style={{ borderRadius: triggerRadius }}
            layout
            layoutId={layoutId}
            className="absolute inset-0 transform-gpu will-change-transform"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            layout={false}
            onClick={expand}
            className="relative cursor-pointer"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ExpandableScreenContentProps {
  children: ReactNode
  className?: string
  showCloseButton?: boolean
  closeButtonClassName?: string
  closeButtonAriaLabel?: string
}

export function ExpandableScreenContent({
  children,
  className = "",
  showCloseButton = true,
  closeButtonClassName = "",
  closeButtonAriaLabel = "Close waitlist application",
}: ExpandableScreenContentProps) {
  const { isExpanded, collapse, layoutId, contentRadius, animationDuration } =
    useExpandableScreen()

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-2" data-expandable-screen-content>
          <motion.div
            layoutId={layoutId}
            transition={{ duration: animationDuration }}
            style={{ borderRadius: contentRadius }}
            layout
            className={`relative flex h-full w-full overflow-y-auto transform-gpu will-change-transform ${className}`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="relative z-20 w-full"
            >
              {children}
            </motion.div>

            {showCloseButton && (
              <motion.button
                onClick={collapse}
                className={`absolute right-6 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-muted ${closeButtonClassName || ""}`}
                aria-label={closeButtonAriaLabel}
              >
                <X className="h-5 w-5" />
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface ExpandableScreenBackgroundProps {
  trigger?: ReactNode
  content?: ReactNode
  className?: string
}

export function ExpandableScreenBackground({
  trigger,
  content,
  className = "",
}: ExpandableScreenBackgroundProps) {
  const { isExpanded } = useExpandableScreen()

  if (isExpanded && content) return <div className={className}>{content}</div>
  if (!isExpanded && trigger) return <div className={className}>{trigger}</div>
  return null
}

export { useExpandableScreen }
