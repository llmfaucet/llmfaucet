"use client"

import { useEffect, useState } from "react"
import {
  GitHubStarsWheel as RegistryGitHubStarsWheel,
  type GitHubStarsWheelProps,
} from "@/components/animate-ui/components/animate/github-stars-wheel"
import { api } from "@/lib/api-client"

export function GitHubStarsWheel({ value, ...props }: GitHubStarsWheelProps) {
  const [stars, setStars] = useState<number | null>(value ?? null)

  useEffect(() => {
    if (value !== undefined) {
      setStars(value)
      return
    }

    api.publicGithub()
      .then((data) => setStars(data.stars))
      .catch(() => setStars(null))
  }, [value])

  if (stars === null) return null

  return (
    <RegistryGitHubStarsWheel
      {...props}
      username="llmfaucet"
      repo="llmfaucet"
      value={stars}
      direction="btt"
      step={1}
      itemsSize={35}
      sideItemsCount={2}
      aria-label={`GitHub stars: ${stars}`}
    />
  )
}
