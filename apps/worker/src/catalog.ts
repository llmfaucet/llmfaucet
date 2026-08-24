import type { Model } from './types';

export const MODELS: Model[] = [
  { id: 'pollinations/gpt-5', provider: 'pollinations', capabilities: ['chat', 'tools', 'completion'], quality: 9, speed: 8, context: 128000, supported_parameters: ['temperature', 'max_tokens', 'stream', 'tools', 'response_format'] },
  { id: 'pollinations/gemini-3-flash', provider: 'pollinations', capabilities: ['chat', 'vision', 'tools'], quality: 8, speed: 10, context: 1000000, supported_parameters: ['temperature', 'max_tokens', 'stream', 'tools'] },
  { id: 'pollinations/qwen3-coder', provider: 'pollinations', capabilities: ['chat', 'tools', 'completion'], quality: 8, speed: 8, context: 128000, supported_parameters: ['temperature', 'max_tokens', 'stream', 'tools'] },
  { id: 'llm7/gpt-5.4', provider: 'llm7', capabilities: ['chat', 'tools', 'completion'], quality: 9, speed: 8, context: 200000, supported_parameters: ['temperature', 'max_tokens', 'stream', 'tools', 'response_format'] },
  { id: 'llm7/claude-sonnet-5', provider: 'llm7', capabilities: ['chat', 'vision', 'tools'], quality: 10, speed: 7, context: 200000, supported_parameters: ['temperature', 'max_tokens', 'stream', 'tools'] },
  { id: 'opencode/deepseek-v4-flash-free', provider: 'opencode-zen', capabilities: ['chat', 'tools', 'completion'], quality: 8, speed: 8, context: 128000, supported_parameters: ['temperature', 'max_tokens', 'stream', 'tools'] },
  { id: 'opencode/qwen3.6-plus-free', provider: 'opencode-zen', capabilities: ['chat', 'tools'], quality: 8, speed: 7, context: 128000, supported_parameters: ['temperature', 'max_tokens', 'stream', 'tools'] },
  { id: 'ovh/llama-3.1-8b', provider: 'ovh', capabilities: ['chat', 'completion'], quality: 6, speed: 7, context: 128000, supported_parameters: ['temperature', 'max_tokens', 'stream'] },
  { id: 'ovh/qwen2.5-vl-72b', provider: 'ovh', capabilities: ['chat', 'vision'], quality: 8, speed: 5, context: 32768, supported_parameters: ['temperature', 'max_tokens', 'stream'] },
  { id: 'horde/auto', provider: 'ai-horde', capabilities: ['chat'], quality: 6, speed: 2, context: 32768, supported_parameters: ['temperature', 'max_tokens'] }
  ,{ id: 'ovh/bge-m3', provider: 'ovh', capabilities: ['embeddings'], quality: 7, speed: 6, context: 8192, supported_parameters: [], family: 'bge-m3' }
];

export function publicModels(): Model[] { return MODELS; }
export function findModel(id: string, models: Model[] = MODELS): Model | undefined { return models.find((m) => m.id === id); }
