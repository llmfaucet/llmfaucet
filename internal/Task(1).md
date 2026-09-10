# TASK: Implement @llmfaucet/sdk — AI Gateway Client with Agent Configuration

You are working in the `llmfaucet` monorepo.

Implement `@llmfaucet/sdk`, a comprehensive TypeScript/JavaScript SDK for the llmfaucet API.

This SDK includes:
1. **API client** — Chat, models, usage, embeddings, keys
2. **Agent configuration** — Built-in generators for Aider, Cline, Claude Code, Continue, etc.
3. **Type-safe** — Full TypeScript support
4. **Streaming support** — SSE stream handling
5. **Error handling** — Typed error classes
6. **Framework-agnostic** — Works in Node, browser, bundlers

## Reference Architecture

**CRITICAL:** Before implementing, study the reference patterns in:

```text
.internal/referrence/ai-sdk/
```

This directory contains:
- ✅ **Design patterns** — Client architecture, resource pattern, builder pattern
- ✅ **Method signatures** — Consistent API design, naming conventions
- ✅ **System design** — Request/response flow, error handling, retry logic
- ✅ **Handshake protocols** — Authentication flow, session management, token refresh
- ✅ **Streaming patterns** — SSE handling, backpressure, chunk parsing
- ✅ **Type patterns** — Generic types, discriminated unions, type guards
- ✅ **Testing patterns** — Mock strategies, fixture organization, test utilities

### Required Study Steps

1. **Read all TypeScript files** in `.internal/referrence/ai-sdk/src/`
2. **Analyze test patterns** in `.internal/referrence/ai-sdk/test/`
3. **Review examples** in `.internal/referrence/ai-sdk/examples/`
4. **Extract reusable patterns** — Do not copy code directly unless MIT-licensed
5. **Adapt to llmfaucet** — Apply patterns, not implementation details

### Key Patterns to Extract

From the reference SDK, identify and adapt:

#### Client Architecture
- How is the main client structured?
- How are resources organized?
- How is configuration handled?
- How are requests constructed?

#### Method Patterns
- What's the signature for `create()`, `list()`, `retrieve()`?
- How are optional parameters handled?
- How are callbacks/hooks implemented?
- What's the error handling pattern?

#### System Design
- How is authentication implemented?
- How are retries handled?
- How is timeout managed?
- How is logging/debugging done?

#### Handshake & Auth
- How does the initial handshake work?
- How are tokens refreshed?
- How are sessions managed?
- How are API keys rotated?

#### Streaming
- How are SSE streams parsed?
- How is backpressure handled?
- How are chunks accumulated?
- How are stream errors caught?

#### Type Patterns
- How are request/response types structured?
- How are generics used?
- How are discriminated unions applied?
- How are type guards implemented?

---

## Important Design Decisions

- ✅ **Include agent config in SDK** — Keep API client and agent config together
- ✅ **Brand as llmfaucet** — This is llmfaucet's official SDK
- ✅ **Single package** — No separate `agent-compat` package
- ✅ **Modular exports** — Tree-shakeable, import only what you need
- ✅ **Extensible** — Easy to add new agent adapters
- ✅ **Follow reference patterns** — Use `.internal/referrence/ai-sdk` as architectural guide

---

## 1. Package Structure

```text
packages/sdk/
├── src/
│   ├── index.ts              # Public exports
│   ├── client.ts             # Main LlmFaucetClient class
│   ├── types/
│   │   ├── client.ts         # Client configuration types
│   │   ├── chat.ts           # Chat completion types
│   │   ├── models.ts         # Model catalog types
│   │   ├── usage.ts          # Usage response types
│   │   ├── embeddings.ts     # Embedding types
│   │   ├── keys.ts           # API key types
│   │   └── agent.ts          # Agent configuration types
│   ├── resources/
│   │   ├── chat.ts           # /v1/chat/completions
│   │   ├── models.ts         # /v1/models
│   │   ├── usage.ts          # /account/usage
│   │   ├── embeddings.ts     # /v1/embeddings
│   │   ├── keys.ts           # /account/keys
│   │   └── agents.ts         # Agent configuration generators
│   ├── agents/
│   │   ├── base.ts           # Base agent adapter
│   │   ├── aider.ts          # Aider configuration
│   │   ├── claude-code.ts    # Claude Code configuration
│   │   ├── cline.ts          # Cline/Roo Code configuration
│   │   ├── codex.ts          # OpenAI Codex CLI configuration
│   │   ├── continue.ts       # Continue.dev configuration
│   │   ├── roo-code.ts       # Roo Code helpers
│   │   └── generic.ts        # Generic OpenAI-compatible config
│   ├── errors.ts             # Error classes
│   └── lib/
│       ├── fetch.ts          # Fetch wrapper with retry
│       ├── stream.ts         # SSE stream helpers
│       └── auth.ts           # Authentication utilities
├── test/
│   ├── client.test.ts
│   ├── chat.test.ts
│   ├── models.test.ts
│   ├── errors.test.ts
│   └── agents/
│       ├── aider.test.ts
│       ├── cline.test.ts
│       └── claude-code.test.ts
├── examples/
│   ├── basic-usage.ts
│   ├── streaming.ts
│   └── agent-setup.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## 2. Core Types

```ts
// src/types/client.ts
export interface LlmFaucetConfig {
  /** API base URL (default: 'https://api.llmfaucet.dev/v1') */
  baseURL?: string
  
  /** API key for authentication */
  apiKey?: string
  
  /** Request timeout in ms (default: 30000) */
  timeout?: number
  
  /** Enable debug logging */
  debug?: boolean
  
  /** Custom fetch implementation */
  fetch?: typeof fetch
  
  /** Retry configuration */
  retry?: {
    maxRetries?: number
    backoff?: 'linear' | 'exponential'
    delayMs?: number
  }
  
  /** Authentication callback (for token refresh) */
  onAuthRequired?: () => Promise<string>
}

export interface RequestOptions {
  /** Additional headers */
  headers?: Record<string, string>
  
  /** Custom timeout */
  timeout?: number
  
  /** Retry count override */
  retries?: number
  
  /** Skip authentication */
  skipAuth?: boolean
  
  /** Custom fetch override */
  fetch?: typeof fetch
}
```

```ts
// src/types/agent.ts
export type ConfigFormat = 'json' | 'yaml' | 'toml' | 'env'

export interface AgentConfig {
  /** Agent identifier (e.g., 'aider', 'cline') */
  agent: string
  
  /** Agent display name */
  displayName: string
  
  /** Path to config file */
  path: string
  
  /** Config file content */
  content: string
  
  /** File format */
  format: ConfigFormat
  
  /** Instructions for the user */
  instructions?: string[]
  
  /** Warnings or notes */
  warnings?: string[]
  
  /** Links to documentation */
  docs?: string[]
}

export interface AgentConfigOptions {
  /** API base URL */
  baseURL: string
  
  /** API key */
  apiKey: string
  
  /** Default model */
  defaultModel: string
  
  /** Optional custom settings */
  customSettings?: Record<string, unknown>
  
  /** Optional environment name */
  environmentName?: string
}

export interface AgentAdapter {
  id: string
  displayName: string
  detect(): Promise<boolean>
  generateConfig(options: AgentConfigOptions): AgentConfig
  validateConfig?(config: string): boolean
  supportedFormats?: ConfigFormat[]
}
```

---

## 3. Main Client

```ts
// src/client.ts
import { LlmFaucetConfig, RequestOptions } from './types/client'
import { ChatResource } from './resources/chat'
import { ModelsResource } from './resources/models'
import { UsageResource } from './resources/usage'
import { EmbeddingsResource } from './resources/embeddings'
import { KeysResource } from './resources/keys'
import { AgentsResource } from './resources/agents'
import { LlmFaucetError } from './errors'
import { retryWithBackoff } from './lib/fetch'

export class LlmFaucetClient {
  public readonly chat: ChatResource
  public readonly models: ModelsResource
  public readonly usage: UsageResource
  public readonly embeddings: EmbeddingsResource
  public readonly keys: KeysResource
  public readonly agents: AgentsResource

  private readonly baseURL: string
  private readonly apiKey?: string
  private readonly timeout: number
  private readonly debug: boolean
  private readonly fetchFn: typeof fetch
  private readonly retryConfig: Required<NonNullable<LlmFaucetConfig['retry']>>
  private readonly onAuthRequired?: () => Promise<string>

  constructor(config: LlmFaucetConfig = {}) {
    this.baseURL = config.baseURL ?? 'https://api.llmfaucet.dev/v1'
    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? 30000
    this.debug = config.debug ?? false
    this.fetchFn = config.fetch ?? fetch
    this.onAuthRequired = config.onAuthRequired
    this.retryConfig = {
      maxRetries: config.retry?.maxRetries ?? 2,
      backoff: config.retry?.backoff ?? 'exponential',
      delayMs: config.retry?.delayMs ?? 1000,
    }

    this.chat = new ChatResource(this)
    this.models = new ModelsResource(this)
    this.usage = new UsageResource(this)
    this.embeddings = new EmbeddingsResource(this)
    this.keys = new KeysResource(this)
    this.agents = new AgentsResource(this)

    if (this.debug) {
      console.log('[LlmFaucetClient] Initialized with baseURL:', this.baseURL)
    }
  }

  async request<T>(path: string, options: RequestInit & RequestOptions = {}): Promise<T> {
    const makeRequest = async () => {
      const url = `${this.baseURL}${path}`
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(this.apiKey && !options.skipAuth && { Authorization: `Bearer ${this.apiKey}` }),
        ...options.headers,
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? this.timeout)

      try {
        const response = await this.fetchFn(url, {
          ...options,
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          
          // Handle 401 with token refresh
          if (response.status === 401 && this.onAuthRequired) {
            const newToken = await this.onAuthRequired()
            // Retry with new token
            const retryResponse = await this.fetchFn(url, {
              ...options,
              headers: {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              },
              signal: controller.signal,
            })
            
            if (!retryResponse.ok) {
              const retryError = await retryResponse.json().catch(() => ({}))
              throw new LlmFaucetError({
                status: retryResponse.status,
                message: retryError.message ?? `Request failed with status ${retryResponse.status}`,
                code: retryError.code,
              })
            }
            
            return retryResponse.json()
          }
          
          throw new LlmFaucetError({
            status: response.status,
            message: error.message ?? `Request failed with status ${response.status}`,
            code: error.code,
          })
        }

        return response.json()
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof LlmFaucetError) throw error
        throw new LlmFaucetError({
          message: error instanceof Error ? error.message : 'Network error',
        })
      }
    }

    // Apply retry logic
    return retryWithBackoff(makeRequest, {
      maxRetries: options.retries ?? this.retryConfig.maxRetries,
      backoff: this.retryConfig.backoff,
      delayMs: this.retryConfig.delayMs,
    })
  }
}
```

---

## 4. Authentication Utilities

```ts
// src/lib/auth.ts
import { LlmFaucetError } from '../errors'

export interface AuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  tokenType?: string
}

export interface AuthConfig {
  clientId: string
  clientSecret?: string
  redirectUri?: string
  scopes?: string[]
}

/**
 * Parse JWT token and extract expiration
 */
export function parseJwtToken(token: string): { payload: any; expiresAt: number } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    
    const payload = JSON.parse(atob(parts))[1]
    const expiresAt = payload.exp ? payload.exp * 1000 : 0
    
    return { payload, expiresAt }
  } catch (error) {
    throw new LlmFaucetError({
      message: `Failed to parse JWT: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpired(token: string, bufferMs: number = 60000): boolean {
  try {
    const { expiresAt } = parseJwtToken(token)
    if (!expiresAt) return false
    
    return Date.now() + bufferMs >= expiresAt
  } catch {
    return true // If we can't parse, assume expired
  }
}

/**
 * Build OAuth authorization URL
 */
export function buildAuthUrl(config: AuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri ?? '',
    response_type: 'code',
    scope: config.scopes?.join(' ') ?? '',
    state: state,
  })
  
  return `https://api.llmfaucet.dev/oauth/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForToken(
  code: string,
  config: AuthConfig,
  fetchFn: typeof fetch
): Promise<AuthToken> {
  const response = await fetchFn('https://api.llmfaucet.dev/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.clientSecret && {
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      }),
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new LlmFaucetError({
      status: response.status,
      message: error.message ?? 'Failed to exchange code for token',
      code: error.code,
    })
  }
  
  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    tokenType: data.token_type,
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: AuthConfig,
  fetchFn: typeof fetch
): Promise<AuthToken> {
  const response = await fetchFn('https://api.llmfaucet.dev/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.clientSecret && {
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      }),
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  
  if (!response.ok) {
    throw new LlmFaucetError({
      status: response.status,
      message: 'Failed to refresh token',
    })
  }
  
  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    tokenType: data.token_type,
  }
}
```

---

## 5. Retry and Fetch Utilities

```ts
// src/lib/fetch.ts
import { LlmFaucetError } from '../errors'

export interface RetryConfig {
  maxRetries: number
  backoff: 'linear' | 'exponential'
  delayMs: number
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on certain errors
      if (error instanceof LlmFaucetError) {
        if (error.status === 401 || error.status === 403 || error.status === 422) {
          throw error // Don't retry auth/validation errors
        }
      }
      
      // If this was the last attempt, throw
      if (attempt === config.maxRetries) {
        throw lastError
      }
      
      // Calculate delay
      let delay: number
      if (config.backoff === 'linear') {
        delay = config.delayMs * (attempt + 1)
      } else {
        delay = config.delayMs * Math.pow(2, attempt)
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof LlmFaucetError) {
    // Retry on server errors (5xx) and rate limits
    return (
      error.status === 429 ||
      (error.status ?? 0) >= 500
    )
  }
  
  // Retry on network errors
  return true
}
```

```ts
// src/lib/stream.ts
export interface StreamOptions {
  signal?: AbortSignal
  onChunk?: (chunk: any) => void
  onError?: (error: Error) => void
  onEnd?: () => void
}

export async function* streamSSE(
  url: string,
  options: RequestInit & StreamOptions
): AsyncGenerator<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Accept': 'text/event-stream',
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message ?? `Stream failed: ${response.status}`)
  }
  
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')
  
  const decoder = new TextDecoder()
  let buffer = ''
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6))
            yield data
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
```

---

## 6. Agent Configuration Resource

```ts
// src/resources/agents.ts
import { LlmFaucetClient } from '../client'
import { AgentConfig, AgentConfigOptions } from '../types/agent'
import { AiderAdapter } from '../agents/aider'
import { ClineAdapter } from '../agents/cline'
import { ClaudeCodeAdapter } from '../agents/claude-code'
import { ContinueAdapter } from '../agents/continue'
import { GenericAdapter } from '../agents/generic'

export class AgentsResource {
  constructor(private readonly client: LlmFaucetClient) {}

  private adapters: Record<string, any> = {
    aider: AiderAdapter,
    cline: ClineAdapter,
    'claude-code': ClaudeCodeAdapter,
    continue: ContinueAdapter,
    generic: GenericAdapter,
  }

  /**
   * Generate config for a specific agent
   */
  generateConfig(agentId: string, options: AgentConfigOptions): AgentConfig {
    const AdapterClass = this.adapters[agentId]
    if (!AdapterClass) {
      throw new Error(`Unknown agent: ${agentId}. Supported: ${Object.keys(this.adapters).join(', ')}`)
    }

    const adapter = new AdapterClass()
    return adapter.generateConfig(options)
  }

  /**
   * Generate configs for all supported agents
   */
  generateAllConfigs(options: AgentConfigOptions): AgentConfig[] {
    return Object.keys(this.adapters).map(agentId =>
      this.generateConfig(agentId, options)
    )
  }

  /**
   * Get list of supported agents
   */
  getSupportedAgents(): Array<{ id: string; name: string }> {
    return Object.keys(this.adapters).map(agentId => {
      const AdapterClass = this.adapters[agentId]
      const adapter = new AdapterClass()
      return {
        id: adapter.id,
        name: adapter.displayName,
      }
    })
  }

  /**
   * Detect installed agent (Node.js only)
   */
  async detectAgent(): Promise<{ agentId: string | null; displayName: string | null; confidence: number }> {
    if (typeof process === 'undefined') {
      // Browser environment
      return { agentId: null, displayName: null, confidence: 0 }
    }

    const adapters = [
      new AiderAdapter(),
      new ClineAdapter(),
      new ClaudeCodeAdapter(),
      new ContinueAdapter(),
    ]

    const results = await Promise.all(
      adapters.map(async (adapter) => {
        try {
          const isDetected = await adapter.detect()
          return {
            agentId: isDetected ? adapter.id : null,
            displayName: isDetected ? adapter.displayName : null,
            confidence: isDetected ? 0.9 : 0,
          }
        } catch {
          return { agentId: null, displayName: null, confidence: 0 }
        }
      })
    )

    const best = results.reduce((a, b) => (a.confidence > b.confidence ? a : b))
    return best.confidence > 0 ? best : { agentId: null, displayName: null, confidence: 0 }
  }
}
```

---

## 7. Agent Adapters

Implement all adapters following the patterns from `.internal/referrence/ai-sdk/`:

- ✅ Use consistent method signatures
- ✅ Apply error handling patterns
- ✅ Follow type patterns
- ✅ Use proper async/await patterns
- ✅ Include proper JSDoc comments

(See previous prompt for full adapter implementations — adapt them using reference patterns)

---

## 8. Public Exports

```ts
// src/index.ts

// Main client
export { LlmFaucetClient } from './client'

// Types
export type { LlmFaucetConfig, RequestOptions } from './types/client'
export type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionMessage,
} from './types/chat'
export type { Model, ModelList } from './types/models'
export type { UsageResponse } from './types/usage'
export type { ApiKey, CreateApiKeyRequest } from './types/keys'
export type { AgentConfig, AgentConfigOptions, AgentAdapter } from './types/agent'

// Errors
export { LlmFaucetError, RateLimitError, AuthenticationError } from './errors'

// Resources (advanced usage)
export { ChatResource } from './resources/chat'
export { ModelsResource } from './resources/models'
export { UsageResource } from './resources/usage'
export { EmbeddingsResource } from './resources/embeddings'
export { KeysResource } from './resources/keys'
export { AgentsResource } from './resources/agents'

// Agent adapters (for custom usage)
export { AiderAdapter } from './agents/aider'
export { ClineAdapter } from './agents/cline'
export { ClaudeCodeAdapter } from './agents/claude-code'
export { ContinueAdapter } from './agents/continue'
export { GenericAdapter } from './agents/generic'
export { BaseAdapter } from './agents/base'

// Utilities
export { parseJwtToken, isTokenExpired, buildAuthUrl, exchangeCodeForToken } from './lib/auth'
export { retryWithBackoff, isRetryableError } from './lib/fetch'
export { streamSSE } from './lib/stream'
```

---

## 9. Completion Requirements

```text
[ ] Study .internal/referrence/ai-sdk patterns
[ ] Apply reference patterns to client architecture
[ ] Apply reference patterns to method signatures
[ ] Apply reference patterns to error handling
[ ] Apply reference patterns to retry logic
[ ] Apply reference patterns to streaming
[ ] Apply reference patterns to type definitions
[ ] All agent adapters implemented (aider, cline, claude-code, continue, generic)
[ ] API client resources implemented (chat, models, usage, keys, embeddings)
[ ] Agent detection working in Node.js
[ ] Full TypeScript types
[ ] All tests passing
[ ] README complete with examples
[ ] package.json configured correctly
[ ] Tree-shakeable exports
[ ] Streaming support working
[ ] Error handling typed
[ ] Examples directory with usage patterns
[ ] Auth utilities implemented
[ ] Retry logic implemented
[ ] Stream utilities implemented
```

---

## 10. Next Steps

After SDK is complete:

1. ✅ Use in `apps/web` dashboard for API key setup
2. ✅ Use in `packages/cli` for `llmfaucet setup` command
3. ✅ Use in docs for code examples
4. ✅ Publish to npm when ready

***

## Provider Categories

### 1. Free Public APIs (No Key Required)

| Provider | Models | Chat | Embeddings | Streaming | Notes |
|---|---|:---:|:---:|:---:|---|
| **Pollinations** | Various open models | ✅ | ❌ | ✅ | OpenAI-compatible, reliable |
| **LLM7** | Llama, Mistral, etc. | ✅ | ❌ | ✅ | OpenAI-compatible endpoint |
| **OpenCode Zen** | Coding-focused models | ✅ | ❌ | ✅ | Optimized for code generation |
| **AI Horde** | Community-hosted models | ✅ | ❌ | ✅ | Decentralized, variable quality |
| **GPT4Free** | GPT-3.5, GPT-4 | ✅ | ❌ | ✅ | Unofficial, may be unstable |
| **FreeLLMAPI** | Various | ✅ | ❌ | ✅ | Aggregator of free endpoints |

***

### 2. Cloud Provider AI Endpoints

| Provider | Models | Chat | Embeddings | Streaming | Auth | Notes |
|---|---|:---:|:---:|:---:|:---:|---|
| **OVHcloud AI** | Llama 3 70B | ✅ | ❌ | ✅ | API Key | European, GDPR-compliant |
| **Google Vertex AI** | Gemini, PaLM | ✅ | ✅ | ✅ | OAuth/Key | Enterprise-grade |
| **AWS Bedrock** | Claude, Llama, Titan | ✅ | ✅ | ✅ | IAM | Pay-per-use |
| **Azure OpenAI** | GPT-4, GPT-3.5 | ✅ | ✅ | ✅ | API Key | Microsoft ecosystem |
| **Oracle Cloud AI** | Cohere, Llama | ✅ | ✅ | ✅ | API Key | Enterprise focus |
| **IBM Watsonx** | Granite, Llama | ✅ | ✅ | ✅ | API Key | Enterprise AI |

***

### 3. Open-Source Model Hosts

| Provider | Models | Chat | Embeddings | Streaming | Auth | Notes |
|---|---|:---:|:---:|:---:|:---:|---|
| **Hugging Face Inference** | 100k+ models | ✅ | ✅ | ✅ | Token | Largest model library |
| **Replicate** | Llama, SD, etc. | ✅ | ❌ | ✅ | API Key | Pay-per-second |
| **Together AI** | Llama, Mistral, etc. | ✅ | ✅ | ✅ | API Key | Fast, cheap |
| **Anyscale** | Llama, Mistral | ✅ | ❌ | ✅ | API Key | Serverless inference |
| **Baseten** | Custom models | ✅ | ❌ | ✅ | API Key | Model deployment platform |
| **Modal** | Custom deployments | ✅ | ❌ | ✅ | Token | Serverless GPU |

***

### 4. Specialized API Providers

| Provider | Models | Chat | Embeddings | Streaming | Auth | Notes |
|---|---|:---:|:---:|:---:|:---:|---|
| **Cohere** | Command, Embed | ✅ | ✅ | ✅ | API Key | Best embeddings |
| **Anthropic** | Claude 3.x | ✅ | ❌ | ✅ | API Key | High-quality, expensive |
| **Mistral AI** | Mistral, Mixtral | ✅ | ✅ | ✅ | API Key | European, efficient |
| **Perplexity** | pplx-7b, etc. | ✅ | ❌ | ✅ | API Key | Search-augmented |
| **DeepInfra** | Llama, SDXL | ✅ | ✅ | ✅ | API Key | Cheap, fast |
| **Fireworks AI** | Llama, custom | ✅ | ✅ | ✅ | API Key | Fine-tuned models |
| **Groq** | Llama, Mixtral | ✅ | ❌ | ✅ | API Key | Fastest inference |
| **Lepton AI** | Llama, custom | ✅ | ❌ | ✅ | Token | Serverless deployment |
| **Novita AI** | Llama, SD | ✅ | ❌ | ✅ | API Key | Image + text |
| **Segmind** | SDXL, Llama | ✅ | ❌ | ✅ | API Key | Image generation focus |

***

### 5. Regional/Local Providers

| Provider | Region | Models | Chat | Embeddings | Streaming | Auth | Notes |
|---|---|---|:---:|:---:|:---:|:---:|---|
| **Scaleway AI** | EU | Llama, Mistral | ✅ | ❌ | ✅ | Key | French cloud |
| **Clever Cloud** | EU | Various | ✅ | ❌ | ✅ | Key | French hosting |
| **Tencent Cloud** | CN | HunYuan | ✅ | ✅ | ✅ | Key | China-focused |
| **Alibaba Cloud** | CN | Qwen | ✅ | ✅ | ✅ | Key | China, SE Asia |
| **Naver Cloud** | KR | HyperCLOVA | ✅ | ❌ | ✅ | Key | Korean market |
| **Sakura Cloud** | JP | Various | ✅ | ❌ | ✅ | Key | Japanese market |

***

### 6. Aggregators/Meta-Providers

| Provider | Models | Chat | Embeddings | Streaming | Auth | Notes |
|---|---|:---:|:---:|:---:|:---:|---|
| **LiteLLM** | 100+ providers | ✅ | ✅ | ✅ | Varies | Self-hosted proxy |
| **OpenRouter** | 50+ providers | ✅ | ❌ | ✅ | API Key | Unified API |
| **AI21** | Jurassic, etc. | ✅ | ❌ | ✅ | API Key | Multiple models |
| **Unify AI** | Various | ✅ | ❌ | ✅ | API Key | Cheapest routing |
| **DeepBrain** | Various | ✅ | ❌ | ✅ | API Key | API aggregator |

***

### 7. Self-Hosted Options

| Provider | Models | Chat | Embeddings | Streaming | Notes |
|---|---|:---:|:---:|:---:|---|
| **Ollama** | Local models | ✅ | ✅ | ✅ | Self-hosted, easy setup |
| **vLLM** | Any HF model | ✅ | ❌ | ✅ | High-performance serving |
| **TGI (HuggingFace)** | Any HF model | ✅ | ❌ | ✅ | Production-ready |
| **Llama.cpp** | GGUF models | ✅ | ❌ | ✅ | CPU-optimized |
| **Text Generation WebUI** | Any HF model | ✅ | ❌ | ✅ | Local, feature-rich |
| **LocalAI** | Any HF model | ✅ | ✅ | ✅ | Docker, OpenAI-compatible |
| **FastChat** | Any HF model | ✅ | ❌ | ✅ | Distributed serving |

***

### 8. Emerging/Experimental

| Provider | Models | Chat | Embeddings | Streaming | Notes |
|---|---|:---:|:---:|:---:|---|
| **Petals** | Distributed BLOOM | ✅ | ❌ | ✅ | P2P inference |
| **GritLM** | Embedding models | ❌ | ✅ | ❌ | Best open embeddings |
| **Nomic AI** | Atlas, custom | ✅ | ✅ | ✅ | Embedding focus |
| **Voyage AI** | Embedding models | ❌ | ✅ | ❌ | Best embeddings API |
| **Jina AI** | Embedding models | ❌ | ✅ | ✅ | Search embeddings |
| **FlagEmbedding** | Embedding models | ❌ | ✅ | ❌ | Open-source embeddings |

***

## Provider Priority Matrix

### Tier 1: Core Providers (Launch)
- ✅ Pollinations (reliable, free)
- ✅ LLM7 (good quality, free)
- ✅ OpenCode Zen (coding focus)
- ✅ OVHcloud (enterprise, EU)
- ✅ AI Horde (community, decentralized)

### Tier 2: Growth Providers (Post-Launch)
- 🔲 Together AI (cheap, fast)
- 🔲 DeepInfra (cost-effective)
- 🔲 Groq (fastest inference)
- 🔲 Mistral AI (European, efficient)
- 🔲 Hugging Face Inference (model variety)

### Tier 3: Enterprise Providers (Scale)
- 🔲 AWS Bedrock (enterprise)
- 🔲 Google Vertex AI (enterprise)
- 🔲 Azure OpenAI (enterprise)
- 🔲 Anthropic (high-quality)
- 🔲 Cohere (embeddings)

### Tier 4: Regional Providers (Expansion)
- 🔲 Scaleway AI (EU)
- 🔲 Alibaba Cloud (CN/ASIA)
- 🔲 Naver Cloud (KR)
- 🔲 Sakura Cloud (JP)

### Tier 5: Self-Hosted (Advanced)
- 🔲 Ollama (local dev)
- 🔲 vLLM (production)
- 🔲 LocalAI (docker)

***

## Provider Capability Summary

| Capability | Providers |
|---|---|
| **Best for Chat** | Anthropic, Mistral, Groq, Together |
| **Best for Code** | OpenCode Zen, DeepInfra, Fireworks |
| **Best for Embeddings** | Cohere, Voyage, Jina, GritLM |
| **Best for Speed** | Groq, Together, DeepInfra |
| **Best for Cost** | AI Horde, Pollinations, LLM7, Unify |
| **Best for Privacy** | OVHcloud, Scaleway, Self-hosted |
| **Best for EU** | OVHcloud, Mistral, Scaleway |
| **Best for Enterprise** | AWS, Azure, Google, IBM |
| **Most Models** | Hugging Face, Replicate, OpenRouter |
| **Most Reliable** | Anthropic, AWS, Azure, Google |

***

## Provider Integration Checklist

For each provider, track:

```text
[ ] Adapter implemented
[ ] Health check working
[ ] Model catalog synced
[ ] Streaming tested
[ ] Rate limits documented
[ ] Error handling tested
[ ] Added to D1 providers table
[ ] Admin UI shows provider
[ ] Probe service monitoring
[ ] Documentation written
```

***

## Recommended Launch Provider Set

Start with these 5-7 providers:

1. **Pollinations** - Free, reliable, good fallback
2. **LLM7** - Free, good quality
3. **OpenCode Zen** - Coding specialization
4. **OVHcloud** - Enterprise, EU compliance
5. **AI Horde** - Community, decentralized
6. **Together AI** - Paid tier option, fast
7. **DeepInfra** - Cost-effective scaling

This gives you:
- 3 free providers (redundancy)
- 1 coding-specialized provider
- 1 EU enterprise provider
- 1 community provider
- 2 paid scaling options

***

## Provider Database Seed Data

```sql
-- Insert all recommended providers
INSERT INTO providers (id, name, display_name, base_url, is_enabled, priority, weight, timeout_ms, supports_chat, supports_embeddings, supports_streaming)
VALUES 
  ('pollinations', 'pollinations', 'Pollinations', 'https://image.pollinations.ai', 1, 100, 1.0, 15000, 1, 0, 1),
  ('llm7', 'llm7', 'LLM7', 'https://llm7.net', 1, 95, 1.0, 10000, 1, 0, 1),
  ('opencode_zen', 'opencode_zen', 'OpenCode Zen', 'https://zen.opencode.ai', 1, 90, 1.0, 10000, 1, 0, 1),
  ('ovh', 'ovh', 'OVHcloud AI', 'https://llama-3-70b-instruct.endpoints.kepler.ai.cloud.ovh.net', 1, 85, 1.0, 10000, 1, 0, 1),
  ('ai_horde', 'ai_horde', 'AI Horde', 'https://aihorde.net', 1, 80, 0.8, 30000, 1, 0, 1),
  ('together', 'together', 'Together AI', 'https://api.together.xyz', 0, 75, 1.0, 10000, 1, 1, 1),
  ('deepinfra', 'deepinfra', 'DeepInfra', 'https://api.deepinfra.com', 0, 70, 1.0, 10000, 1, 1, 1);
```

***

Want me to write a prompt for implementing the top 5 providers with full adapters, health checks, and model catalogs?
