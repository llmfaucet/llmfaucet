"use client"

import type { ComponentProps } from "react"
import { CopyButton as AnimateCopyButton } from "@/components/animate-ui/components/buttons/copy"

// The installed Animate UI implementation owns navigator.clipboard fallback,
// the "Unable to copy" state, and its aria-live announcement.

type Props = Omit<ComponentProps<typeof AnimateCopyButton>, "content"> & { content?: string; value?: string; label?: string }

export function CopyButton({ content, value, label = "Copy", ...props }: Props) {
  return <AnimateCopyButton content={content ?? value ?? ""} aria-label={label} title={label} {...props} />
}

export type { CopyButtonProps } from "@/components/animate-ui/components/buttons/copy"
