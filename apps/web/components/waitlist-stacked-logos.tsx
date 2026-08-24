"use client"

import * as React from "react"
import { StackedLogos } from "@/components/ui/stacked-logos"

const vendors = [
  ["Codex", "https://api.iconify.design/logos:openai-icon.svg"],
  ["Claude", "https://cdn.simpleicons.org/claude"],
  ["Cline", "https://cdn.simpleicons.org/cline"],
  ["Cursor", "https://cdn.simpleicons.org/cursor"],
  ["Windsurf", "https://cdn.simpleicons.org/windsurf"],
  ["Replit Agent", "https://cdn.simpleicons.org/replit"],
  ["GitHub Copilot", "https://cdn.simpleicons.org/githubcopilot"],
  ["Anthropic", "https://cdn.simpleicons.org/anthropic"],
  ["Google Gemini", "https://cdn.simpleicons.org/google"],
  ["Meta AI", "https://cdn.simpleicons.org/meta"],
  ["Mistral", "https://cdn.simpleicons.org/mistralai"],
  ["xAI", "https://cdn.simpleicons.org/x"],
  ["DeepSeek", "https://cdn.simpleicons.org/deepseek"],
  ["Qwen", "https://cdn.simpleicons.org/qwen"],
  ["OpenRouter", "https://cdn.simpleicons.org/openrouter"],
  ["Ollama", "https://cdn.simpleicons.org/ollama"],
  ["Hugging Face", "https://cdn.simpleicons.org/huggingface"],
  ["Replicate", "https://cdn.simpleicons.org/replicate"],
  ["Perplexity", "https://cdn.simpleicons.org/perplexity"],
  ["LangChain", "https://cdn.simpleicons.org/langchain"],
  ["Vercel AI", "https://cdn.simpleicons.org/vercel"],
  ["Cloudflare Workers AI", "https://cdn.simpleicons.org/cloudflareworkers"],
  ["Databricks Mosaic AI", "https://cdn.simpleicons.org/databricks"],
  ["Amazon Bedrock", "https://api.iconify.design/logos:aws.svg"],
  ["Microsoft Copilot", "https://api.iconify.design/logos:microsoft-icon.svg"],
  ["Google Vertex AI", "https://cdn.simpleicons.org/googlecloud"],
  ["Zapier AI", "https://cdn.simpleicons.org/zapier"],
  ["n8n AI", "https://cdn.simpleicons.org/n8n"],
  ["Make AI", "https://cdn.simpleicons.org/make"],
  ["Raycast AI", "https://cdn.simpleicons.org/raycast"],
] as const

function logo([name, src]: readonly [string, string]) {
  return <img key={name} src={src} alt={name} loading="lazy" />
}

export function WaitlistStackedLogos() {
  return (
    <div className="mt-8 w-full max-w-[560px] overflow-hidden" aria-label="Supported AI agents and model vendors">
      <StackedLogos
        logoGroups={[
          vendors.slice(0, 8),
          vendors.slice(8, 16),
          vendors.slice(16, 23),
          vendors.slice(23, 30),
        ].map((group) => group.map(logo))}
        logoWidth="25%"
        duration={30}
      />
    </div>
  )
}
