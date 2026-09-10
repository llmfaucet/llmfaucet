export interface Model {
  id: string;
  object?: string;
  owned_by?: string;
  provider?: string;
  capabilities?: string[];
  context_window?: number;
  supported_parameters?: string[];
  [key: string]: unknown;
}
export interface ModelList {
  object: 'list' | string;
  data: Model[];
  [key: string]: unknown;
}
