# TASK: Implement Multi-Provider LLM Gateway with FreeLLMAPI Reference

You are working in the `llmfaucet` monorepo.

Implement a comprehensive multi-provider LLM gateway system that supports **281+ free LLM models across 26+ providers**, using the reference implementation in:

```text
.internal/reference/freellmapi/
```

This is for a **future release** that expands llmfaucet beyond the initial 5-7 providers to support the full ecosystem of free AI APIs.

## Reference Architecture

**CRITICAL:** Before implementing, study the reference patterns in:

```text
.internal/reference/freellmapi/
```

This directory contains:
- ✅ **Provider catalog** — All 26 free LLM providers with endpoints
- ✅ **Model mappings** — 281+ models with capabilities
- ✅ **Request/response patterns** — How each provider formats requests
- ✅ **Authentication patterns** — API keys, tokens, or no auth
- ✅ **Rate limits** — Per-provider limits and quotas
- ✅ **Error handling** — Provider-specific error formats
- ✅ **Streaming support** — Which providers support SSE
- ✅ **Model capabilities** — Chat, completions, embeddings, etc.

### Required Study Steps

1. **Read all provider implementations** in `.internal/reference/freellmapi/src/providers/`
2. **Analyze model catalog** in `.internal/reference/freellmapi/src/models/`
3. **Review routing logic** in `.internal/reference/freellmapi/src/router/`
4. **Extract provider patterns** — Adapter patterns, normalization, error handling
5. **Adapt to llmfaucet** — Apply patterns, not implementation details

---

## Provider Categories

### Tier 1: Core Providers (Initial Launch)
- ✅ Pollinations
- ✅ LLM7
- ✅ OpenCode Zen
- ✅ OVHcloud
- ✅ AI Horde

### Tier 2: FreeLLMAPI Providers (Future Release)

#### Category A: No Auth Required (15 providers)

| Provider | Models | Chat | Stream | Embeddings | Notes |
|---|---:|:---:|:---:|:---:|---|
| **Pollinations** | 20+ | ✅ | ✅ | ❌ | Reliable, fast |
| **LLM7** | 15+ | ✅ | ✅ | ❌ | Good quality |
| **OpenCode Zen** | 10+ | ✅ | ✅ | ❌ | Coding focus |
| **GPT4Free** | 5+ | ✅ | ✅ | ❌ | Unofficial API |
| **FreeLLMAPI** | 50+ | ✅ | ✅ | ❌ | Aggregator |
| **AI Horde** | 100+ | ✅ | ✅ | ❌ | Community-hosted |
| **DeepInfra** | 20+ | ✅ | ✅ | ❌ | Fast, cheap |
| **Together AI** | 30+ | ✅ | ✅ | ✅ | Enterprise-grade free tier |
| **Hugging Face** | 100k+ | ✅ | ✅ | ✅ | Largest catalog |
| **Replicate** | 500+ | ✅ | ✅ | ❌ | Pay-per-second (free tier) |
| **Baseten** | 50+ | ✅ | ❌ | ❌ | Model deployment |
| **Modal** | Custom | ✅ | ❌ | ❌ | Serverless GPU |
| **Lepton AI** | 20+ | ✅ | ✅ | ❌ | Fast inference |
| **Novita AI** | 10+ | ✅ | ❌ | ❌ | Image + text |
| **Segmind** | 10+ | ✅ | ❌ | ❌ | Image generation |

#### Category B: API Key Required (8 providers)

| Provider | Models | Chat | Stream | Embeddings | Auth | Notes |
|---|---:|:---:|:---:|:---:|:---:|---|
| **Together AI** | 30+ | ✅ | ✅ | ✅ | Key | Fast, cheap |
| **DeepInfra** | 20+ | ✅ | ✅ | ✅ | Key | Cost-effective |
| **Fireworks AI** | 50+ | ✅ | ✅ | ✅ | Key | Fine-tuned models |
| **Groq** | 10+ | ✅ | ✅ | ❌ | Key | Fastest inference |
| **Mistral AI** | 10+ | ✅ | ✅ | ✅ | Key | European, efficient |
| **Cohere** | 10+ | ✅ | ✅ | ✅ | Key | Best embeddings |
| **Perplexity** | 5+ | ✅ | ✅ | ❌ | Key | Search-augmented |
| **Anyscale** | 10+ | ✅ | ❌ | ❌ | Key | Serverless |

#### Category C: Regional Providers (3 providers)

| Provider | Region | Models | Chat | Stream | Auth | Notes |
|---|---|---:|:---:|:---:|:---:|---|
| **OVHcloud** | EU | 5+ | ✅ | ✅ | Key | GDPR-compliant |
| **Scaleway** | EU | 10+ | ✅ | ✅ | Key | French cloud |
| **Alibaba Cloud** | CN/ASIA | 20+ | ✅ | ✅ | Key | China market |

---

## 1. Provider Registry Database Schema

```sql
-- Enhanced provider registry with FreeLLMAPI support
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_header TEXT,
  api_key_required INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  weight REAL NOT NULL DEFAULT 1.0,
  supports_chat INTEGER NOT NULL DEFAULT 1,
  supports_embeddings INTEGER NOT NULL DEFAULT 0,
  supports_streaming INTEGER NOT NULL DEFAULT 1,
  supports_completions INTEGER NOT NULL DEFAULT 0,
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  timeout_ms INTEGER NOT NULL DEFAULT 10000,
  max_retries INTEGER NOT NULL DEFAULT 2,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  
  -- Provider metadata
  category TEXT CHECK (category IN ('no_auth', 'api_key', 'regional', 'enterprise')),
  homepage_url TEXT,
  docs_url TEXT,
  status_page_url TEXT,
  
  -- Capabilities
  max_context_window INTEGER,
  max_output_tokens INTEGER,
  supports_vision INTEGER NOT NULL DEFAULT 0,
  supports_function_calling INTEGER NOT NULL DEFAULT 0,
  supports_json_mode INTEGER NOT NULL DEFAULT 0,
  
  -- Cost (for paid tiers)
  input_cost_per_1m_tokens REAL,
  output_cost_per_1m_tokens REAL,
  
  -- Reliability metrics
  uptime_percentage REAL DEFAULT 100.0,
  avg_latency_ms REAL,
  success_rate_percentage REAL DEFAULT 100.0,
  
  metadata_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced model catalog
CREATE TABLE IF NOT EXISTS provider_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_display_name TEXT,
  model_family TEXT,
  model_size_params INTEGER,
  context_window INTEGER,
  max_output_tokens INTEGER,
  
  -- Capabilities
  supports_chat INTEGER NOT NULL DEFAULT 1,
  supports_completions INTEGER NOT NULL DEFAULT 0,
  supports_embeddings INTEGER NOT NULL DEFAULT 0,
  supports_vision INTEGER NOT NULL DEFAULT 0,
  supports_function_calling INTEGER NOT NULL DEFAULT 0,
  supports_json_mode INTEGER NOT NULL DEFAULT 0,
  supports_streaming INTEGER NOT NULL DEFAULT 1,
  
  -- Performance
  avg_latency_ms REAL,
  tokens_per_second REAL,
  
  -- Cost
  input_cost_per_1m_tokens REAL,
  output_cost_per_1m_tokens REAL,
  
  is_enabled INTEGER NOT NULL DEFAULT 1,
  is_deprecated INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  
  metadata_json TEXT DEFAULT '{}',
  last_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  UNIQUE(provider_id, model_id)
);

-- Provider health and monitoring
CREATE TABLE IF NOT EXISTS provider_health_history (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  latency_ms INTEGER,
  success_rate REAL,
  error_message TEXT,
  error_type TEXT,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- Provider usage statistics
CREATE TABLE IF NOT EXISTS provider_daily_stats (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  date TEXT NOT NULL,
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms REAL,
  p50_latency_ms REAL,
  p95_latency_ms REAL,
  p99_latency_ms REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  UNIQUE(provider_id, date)
);

-- Model usage statistics
CREATE TABLE IF NOT EXISTS model_daily_stats (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  date TEXT NOT NULL,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id, provider_id) REFERENCES provider_models(model_id, provider_id) ON DELETE CASCADE,
  UNIQUE(model_id, provider_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_providers_enabled ON providers(is_enabled);
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);
CREATE INDEX IF NOT EXISTS idx_providers_priority ON providers(priority DESC);
CREATE INDEX IF NOT EXISTS idx_provider_models_lookup ON provider_models(provider_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_provider_models_featured ON provider_models(is_featured, is_enabled);
CREATE INDEX IF NOT EXISTS idx_provider_models_family ON provider_models(model_family);
```

---

## 2. Provider Adapter System

```ts
// apps/worker/src/providers/base.ts
import { ChatCompletionRequest, ChatCompletionResponse, Model } from '@llmfaucet/types'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down'
  latencyMs?: number
  errorMessage?: string
  errorType?: string
  timestamp: string
}

export interface ProviderRequest {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
  timeout: number
  stream?: boolean
}

export interface ProviderResponse {
  status: number
  headers: Headers
  body: unknown
  latencyMs: number
}

export interface ProviderCapabilities {
  supportsChat: boolean
  supportsCompletions: boolean
  supportsEmbeddings: boolean
  supportsStreaming: boolean
  supportsVision: boolean
  supportsFunctionCalling: boolean
  supportsJsonMode: boolean
  maxContextWindow?: number
  maxOutputTokens?: number
}

export interface ProviderAdapter {
  /** Unique provider identifier */
  id: string
  
  /** Human-readable name */
  name: string
  
  /** Base URL for API calls */
  baseURL: string
  
  /** Provider category */
  category: 'no_auth' | 'api_key' | 'regional' | 'enterprise'
  
  /** Get provider capabilities */
  getCapabilities(): ProviderCapabilities
  
  /**
   * Convert OpenAI-compatible request to provider-specific format
   */
  normalizeRequest(request: ChatCompletionRequest): Promise<ProviderRequest>
  
  /**
   * Convert provider response back to OpenAI-compatible format
   */
  normalizeResponse(response: ProviderResponse): Promise<ChatCompletionResponse>
  
  /**
   * Check provider health (lightweight ping)
   */
  checkHealth(): Promise<HealthStatus>
  
  /**
   * Fetch available models from provider
   */
  getModels(): Promise<Model[]>
  
  /**
   * Optional: Transform streaming chunks
   */
  normalizeStreamChunk?(chunk: unknown): Promise<ChatCompletionResponse | null>
}
```

---

## 3. Provider Implementations (Examples)

### Pollinations Adapter

```ts
// apps/worker/src/providers/pollinations.ts
import { ProviderAdapter, ProviderRequest, ProviderResponse, HealthStatus, ProviderCapabilities } from './base'
import { ChatCompletionRequest, ChatCompletionResponse, Model } from '@llmfaucet/types'

export class PollinationsAdapter implements ProviderAdapter {
  id = 'pollinations'
  name = 'Pollinations'
  baseURL = 'https://image.pollinations.ai'
  category = 'no_auth'
  
  getCapabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsCompletions: false,
      supportsEmbeddings: false,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: false,
      supportsJsonMode: false,
      maxContextWindow: 8192,
    }
  }
  
  async normalizeRequest(request: ChatCompletionRequest): Promise<ProviderRequest> {
    return {
      url: `${this.baseURL}/v1/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        model: request.model.replace('pollinations:', ''),
        messages: request.messages,
        stream: request.stream,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        frequency_penalty: request.frequency_penalty,
        presence_penalty: request.presence_penalty,
      },
      timeout: 15000,
      stream: request.stream,
    }
  }
  
  async normalizeResponse(response: ProviderResponse): Promise<ChatCompletionResponse> {
    // Already OpenAI-compatible
    return response.body as ChatCompletionResponse
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const start = Date.now()
    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 5000)
      
      const res = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: controller.signal,
      })
      
      const latency = Date.now() - start
      
      if (!res.ok) {
        return {
          status: 'degraded',
          latencyMs: latency,
          errorMessage: `Health check failed: ${res.status}`,
          timestamp: new Date().toISOString(),
        }
      }
      
      return {
        status: 'healthy',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'down',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  }
  
  async getModels(): Promise<Model[]> {
    try {
      const res = await fetch(`${this.baseURL}/v1/models`)
      if (!res.ok) return []
      
      const data = await res.json()
      return data.data || []
    } catch {
      return []
    }
  }
}
```

### AI Horde Adapter

```ts
// apps/worker/src/providers/ai-horde.ts
import { ProviderAdapter, ProviderRequest, ProviderResponse, HealthStatus, ProviderCapabilities } from './base'
import { ChatCompletionRequest, ChatCompletionResponse, Model } from '@llmfaucet/types'

export class AIHordeAdapter implements ProviderAdapter {
  id = 'ai_horde'
  name = 'AI Horde'
  baseURL = 'https://aihorde.net'
  category = 'no_auth'
  
  getCapabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsCompletions: false,
      supportsEmbeddings: false,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: false,
      supportsJsonMode: false,
      maxContextWindow: 4096,
    }
  }
  
  async normalizeRequest(request: ChatCompletionRequest): Promise<ProviderRequest> {
    // AI Horde uses a different format
    return {
      url: `${this.baseURL}/api/v2/generate/text/async`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': '0000000000', // Anonymous
      },
      body: {
        prompt: this.messagesToPrompt(request.messages),
        max_length: request.max_tokens ?? 1024,
        max_context_length: 4096,
        models: ['stablelm-7b-chat'], // Default model
        stream: request.stream,
      },
      timeout: 30000,
      stream: request.stream,
    }
  }
  
  async normalizeResponse(response: ProviderResponse): Promise<ChatCompletionResponse> {
    // Convert AI Horde format to OpenAI
    const hordeResponse = response.body as any
    
    return {
      id: hordeResponse.id || `hord-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now() / 1000,
      model: 'stablelm-7b-chat',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: hordeResponse.text || '',
          },
          finish_reason: hordeResponse.finish_reason || 'stop',
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    }
  }
  
  private messagesToPrompt(messages: any[]): string {
    // Convert chat messages to single prompt
    return messages.map(m => `${m.role}: ${m.content}`).join('\n')
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const start = Date.now()
    try {
      const res = await fetch(`${this.baseURL}/api/v2/status`)
      const latency = Date.now() - start
      
      if (!res.ok) {
        return {
          status: 'degraded',
          latencyMs: latency,
          timestamp: new Date().toISOString(),
        }
      }
      
      return {
        status: 'healthy',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'down',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  }
  
  async getModels(): Promise<Model[]> {
    try {
      const res = await fetch(`${this.baseURL}/api/v2/status/models`)
      if (!res.ok) return []
      
      const data = await res.json()
      return (data.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        context_window: 4096,
      }))
    } catch {
      return []
    }
  }
}
```

### Together AI Adapter

```ts
// apps/worker/src/providers/together.ts
import { ProviderAdapter, ProviderRequest, ProviderResponse, HealthStatus, ProviderCapabilities } from './base'
import { ChatCompletionRequest, ChatCompletionResponse, Model } from '@llmfaucet/types'

export class TogetherAdapter implements ProviderAdapter {
  id = 'together'
  name = 'Together AI'
  baseURL = 'https://api.together.xyz'
  category = 'api_key'
  
  getCapabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsCompletions: true,
      supportsEmbeddings: true,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
      supportsJsonMode: true,
      maxContextWindow: 32768,
    }
  }
  
  async normalizeRequest(request: ChatCompletionRequest): Promise<ProviderRequest> {
    return {
      url: `${this.baseURL}/v1/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getApiKey()}`,
      },
      body: {
        model: request.model.replace('together:', ''),
        messages: request.messages,
        stream: request.stream,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        frequency_penalty: request.frequency_penalty,
        presence_penalty: request.presence_penalty,
        response_format: request.response_format,
        tools: request.tools,
        tool_choice: request.tool_choice,
      },
      timeout: 20000,
      stream: request.stream,
    }
  }
  
  async normalizeResponse(response: ProviderResponse): Promise<ChatCompletionResponse> {
    return response.body as ChatCompletionResponse
  }
  
  private getApiKey(): string {
    // Would come from env in real implementation
    return ''
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const start = Date.now()
    try {
      const res = await fetch(`${this.baseURL}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
      })
      const latency = Date.now() - start
      
      if (!res.ok) {
        return {
          status: 'degraded',
          latencyMs: latency,
          timestamp: new Date().toISOString(),
        }
      }
      
      return {
        status: 'healthy',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'down',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  }
  
  async getModels(): Promise<Model[]> {
    try {
      const res = await fetch(`${this.baseURL}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
      })
      if (!res.ok) return []
      
      const data = await res.json()
      return data.data || []
    } catch {
      return []
    }
  }
}
```

---

## 4. Provider Registry Service

```ts
// apps/worker/src/services/provider-registry.ts
import { ProviderAdapter, HealthStatus } from '../providers/base'
import { Provider, Model } from '@llmfaucet/types'

export class ProviderRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map()
  
  constructor(private env: Env) {
    this.registerAdapters()
  }
  
  private registerAdapters() {
    // Core providers (Tier 1)
    const { PollinationsAdapter } = require('../providers/pollinations')
    const { LLM7Adapter } = require('../providers/llm7')
    const { OVHAdapter } = require('../providers/ovh')
    
    // FreeLLMAPI providers (Tier 2)
    const { AIHordeAdapter } = require('../providers/ai-horde')
    const { TogetherAdapter } = require('../providers/together')
    const { DeepInfraAdapter } = require('../providers/deepinfra')
    const { FireworksAdapter } = require('../providers/fireworks')
    const { GroqAdapter } = require('../providers/groq')
    const { MistralAdapter } = require('../providers/mistral')
    const { CohereAdapter } = require('../providers/cohere')
    const { HuggingFaceAdapter } = require('../providers/huggingface')
    const { ReplicateAdapter } = require('../providers/replicate')
    // ... more adapters
    
    // Register all adapters
    this.register(new PollinationsAdapter())
    this.register(new LLM7Adapter())
    this.register(new OVHAdapter())
    this.register(new AIHordeAdapter())
    this.register(new TogetherAdapter())
    this.register(new DeepInfraAdapter())
    this.register(new FireworksAdapter())
    this.register(new GroqAdapter())
    this.register(new MistralAdapter())
    this.register(new CohereAdapter())
    this.register(new HuggingFaceAdapter())
    this.register(new ReplicateAdapter())
    // ... register more
  }
  
  private register(adapter: ProviderAdapter) {
    this.adapters.set(adapter.id, adapter)
  }
  
  async getEnabledProviders(category?: string): Promise<Provider[]> {
    let query = `
      SELECT * FROM providers 
      WHERE is_enabled = 1
    `
    
    if (category) {
      query += ` AND category = ?`
    }
    
    query += ` ORDER BY priority DESC, weight DESC`
    
    const { results } = await this.env.DB.prepare(query).bind(category).all()
    
    // Enrich with health status from KV
    const enriched = await Promise.all(
      results.map(async (provider: any) => {
        const healthKey = `provider:health:${provider.id}`
        const healthData = await this.env.KV.get(healthKey)
        const health: HealthStatus | null = healthData ? JSON.parse(healthData) : null
        
        return {
          ...provider,
          health: health ?? { status: 'unknown', timestamp: new Date().toISOString() },
          adapter: this.adapters.get(provider.name),
        }
      })
    )
    
    return enriched
  }
  
  async getProvider(id: string): Promise<Provider | null> {
    const provider = await this.env.DB.prepare(`
      SELECT * FROM providers WHERE id = ?
    `).bind(id).first()
    
    if (!provider) return null
    
    const adapter = this.adapters.get(provider.name)
    if (!adapter) {
      console.error(`No adapter found for provider: ${provider.name}`)
      return null
    }
    
    return { ...provider, adapter }
  }
  
  async getModels(providerId: string): Promise<Model[]> {
    const { results } = await this.env.DB.prepare(`
      SELECT * FROM provider_models 
      WHERE provider_id = ? AND is_enabled = 1 AND is_deprecated = 0
      ORDER BY model_name
    `).bind(providerId).all()
    
    return results
  }
  
  async getAllModels(filters?: {
    family?: string
    supportsChat?: boolean
    supportsVision?: boolean
    minContextWindow?: number
  }): Promise<Model[]> {
    let query = `
      SELECT pm.*, p.name as provider_name, p.display_name as provider_display_name
      FROM provider_models pm
      JOIN providers p ON pm.provider_id = p.id
      WHERE pm.is_enabled = 1 AND pm.is_deprecated = 0 AND p.is_enabled = 1
    `
    
    const params: any[] = []
    
    if (filters?.family) {
      query += ` AND pm.model_family = ?`
      params.push(filters.family)
    }
    
    if (filters?.supportsChat) {
      query += ` AND pm.supports_chat = 1`
    }
    
    if (filters?.supportsVision) {
      query += ` AND pm.supports_vision = 1`
    }
    
    if (filters?.minContextWindow) {
      query += ` AND pm.context_window >= ?`
      params.push(filters.minContextWindow)
    }
    
    query += ` ORDER BY p.priority DESC, pm.context_window DESC`
    
    const { results } = await this.env.DB.prepare(query).bind(...params).all()
    return results
  }
  
  async refreshModels(providerId: string): Promise<void> {
    const provider = await this.getProvider(providerId)
    if (!provider) throw new Error(`Provider not found: ${providerId}`)
    
    const adapter = provider.adapter
    const models = await adapter.getModels()
    
    // Upsert models
    for (const model of models) {
      const id = crypto.randomUUID()
      await this.env.DB.prepare(`
        INSERT INTO provider_models (
          id, provider_id, model_id, model_name, model_display_name,
          context_window, max_output_tokens, last_synced_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(provider_id, model_id) DO UPDATE SET
          model_name = excluded.model_name,
          model_display_name = excluded.model_display_name,
          context_window = excluded.context_window,
          max_output_tokens = excluded.max_output_tokens,
          last_synced_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        id,
        providerId,
        model.id,
        model.name,
        model.display_name || model.name,
        model.context_window || null,
        model.max_output_tokens || null
      ).run()
    }
  }
  
  async updateHealth(providerId: string, health: HealthStatus): Promise<void> {
    const key = `provider:health:${providerId}`
    await this.env.KV.put(key, JSON.stringify(health), { expirationTtl: 300 }) // 5 min cache
    
    // Also log to history
    await this.env.DB.prepare(`
      INSERT INTO provider_health_history (id, provider_id, status, latency_ms, error_message, error_type, checked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      providerId,
      health.status,
      health.latencyMs || null,
      health.errorMessage || null,
      health.errorType || null,
      health.timestamp
    ).run()
  }
}
```

---

## 5. Seeder Script

```ts
// apps/worker/src/scripts/seed-providers.ts
import { ProviderRegistry } from '../services/provider-registry'

export async function seedProviders(env: Env) {
  const registry = new ProviderRegistry(env)
  
  // Seed all 26 FreeLLMAPI providers
  const providers = [
    // No auth providers
    {
      id: 'pollinations',
      name: 'pollinations',
      display_name: 'Pollinations',
      base_url: 'https://image.pollinations.ai',
      category: 'no_auth',
      priority: 100,
      supports_chat: 1,
      supports_streaming: 1,
      timeout_ms: 15000,
    },
    {
      id: 'llm7',
      name: 'llm7',
      display_name: 'LLM7',
      base_url: 'https://llm7.net',
      category: 'no_auth',
      priority: 95,
      supports_chat: 1,
      supports_streaming: 1,
      timeout_ms: 10000,
    },
    {
      id: 'ai_horde',
      name: 'ai_horde',
      display_name: 'AI Horde',
      base_url: 'https://aihorde.net',
      category: 'no_auth',
      priority: 80,
      supports_chat: 1,
      supports_streaming: 1,
      timeout_ms: 30000,
    },
    // API key providers
    {
      id: 'together',
      name: 'together',
      display_name: 'Together AI',
      base_url: 'https://api.together.xyz',
      category: 'api_key',
      priority: 75,
      supports_chat: 1,
      supports_streaming: 1,
      supports_embeddings: 1,
      timeout_ms: 20000,
    },
    {
      id: 'deepinfra',
      name: 'deepinfra',
      display_name: 'DeepInfra',
      base_url: 'https://api.deepinfra.com',
      category: 'api_key',
      priority: 70,
      supports_chat: 1,
      supports_streaming: 1,
      timeout_ms: 15000,
    },
    // ... seed all 26 providers
  ]
  
  for (const provider of providers) {
    try {
      await env.DB.prepare(`
        INSERT INTO providers (
          id, name, display_name, base_url, category,
          priority, supports_chat, supports_streaming,
          supports_embeddings, timeout_ms, is_enabled,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          display_name = excluded.display_name,
          base_url = excluded.base_url,
          priority = excluded.priority,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        provider.id,
        provider.name,
        provider.display_name,
        provider.base_url,
        provider.category,
        provider.priority,
        provider.supports_chat,
        provider.supports_streaming,
        provider.supports_embeddings,
        provider.timeout_ms
      ).run()
      
      console.log(`✓ Seeded provider: ${provider.display_name}`)
    } catch (error) {
      console.error(`✗ Failed to seed ${provider.display_name}:`, error)
    }
  }
  
  console.log(`\nSeeded ${providers.length} providers`)
}
```

---

## 6. Completion Requirements

```text
[ ] Study .internal/reference/freellmapi patterns
[ ] Implement base provider adapter interface
[ ] Implement all 26 provider adapters
[ ] Create D1 migrations for enhanced provider registry
[ ] Create seeder script for all providers
[ ] Implement provider registry service
[ ] Implement health monitoring for all providers
[ ] Implement model catalog sync for all providers
[ ] Add provider filtering and search
[ ] Add model filtering and search
[ ] Implement provider statistics
[ ] Implement model statistics
[ ] Add admin UI for provider management
[ ] Add public model catalog page
[ ] All tests passing
[ ] Documentation complete
```

---

## 7. Future Roadmap

### Phase 1: Core Providers (Current)
- 5-7 providers
- Basic routing
- Simple health checks

### Phase 2: FreeLLMAPI Integration (Next Release)
- 26 providers
- 281+ models
- Advanced routing
- Health monitoring
- Model catalog

### Phase 3: Enterprise Providers (Future)
- AWS Bedrock
- Google Vertex
- Azure OpenAI
- Anthropic
- Paid tiers

### Phase 4: Self-Hosted Support (Future)
- Ollama integration
- vLLM support
- Custom provider registration
- Federated network

---

## 8. Next Steps

After implementation:

1. ✅ Test all 26 providers
2. ✅ Verify health checks work
3. ✅ Verify model catalogs sync
4. ✅ Test routing with multiple providers
5. ✅ Add to admin UI
6. ✅ Document all providers
7. ✅ Create migration guide from old system
