export type ModelSelector = 'auto' | 'auto:fast' | 'auto:smart' | 'auto:coding';
export type ChatMessageContent =
  string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail?: string } }>;
export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: ChatMessageContent | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: unknown[];
}
export interface ChatCompletionRequest {
  model: ModelSelector | string;
  messages: ChatCompletionMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  tools?: unknown[];
  tool_choice?: unknown;
  response_format?: unknown;
  [key: string]: unknown;
}
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion' | string;
  created: number;
  model: string;
  choices: Array<{ index: number; message: ChatCompletionMessage; finish_reason: string | null }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    [key: string]: number | undefined;
  };
  [key: string]: unknown;
}
export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk' | string;
  created: number;
  model: string;
  choices: Array<{ index: number; delta: Partial<ChatCompletionMessage>; finish_reason: string | null }>;
  [key: string]: unknown;
}
