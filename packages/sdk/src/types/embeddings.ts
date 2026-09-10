export interface EmbeddingRequest {
  model: string;
  input: string | string[] | number[] | number[][];
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
  user?: string;
  [key: string]: unknown;
}
export interface Embedding {
  object: 'embedding' | string;
  index: number;
  embedding: number[] | string;
  [key: string]: unknown;
}
export interface EmbeddingResponse {
  object: 'list' | string;
  data: Embedding[];
  model: string;
  usage?: Record<string, number>;
  [key: string]: unknown;
}
