import type { AgentConfig, AgentName, AgentOptions } from '../types';
const json = (agent: AgentName, path: string, value: unknown): AgentConfig => ({
  agent,
  path,
  format: 'json',
  content: JSON.stringify(value, null, 2),
});
export function generateConfig(agent: AgentName, options: AgentOptions): AgentConfig {
  const key = options.apiKey ?? '${LLMFAUCET_API_KEY}';
  if (agent === 'aider')
    return {
      agent,
      path: '.aider.conf.yml',
      format: 'yaml',
      content: `model: openai/${options.defaultModel}\nopenai-api-base: ${options.baseURL}\nopenai-api-key: ${key}`,
    };
  if (agent === 'claude-code')
    return json(agent, '.claude/settings.local.json', {
      env: {
        ANTHROPIC_BASE_URL: options.baseURL.replace(/\/v1\/?$/, ''),
        ANTHROPIC_AUTH_TOKEN: key,
        ANTHROPIC_MODEL: options.defaultModel,
      },
    });
  if (agent === 'cline')
    return json(agent, '.cline/llmfaucet.json', { apiBase: options.baseURL, apiKey: key, model: options.defaultModel });
  if (agent === 'roo-code')
    return json(agent, '.roo/llmfaucet.json', { apiBase: options.baseURL, apiKey: key, model: options.defaultModel });
  if (agent === 'continue')
    return {
      agent,
      path: '.continue/config.yaml',
      format: 'yaml',
      content: `name: llmfaucet\nversion: 0.0.1\nschema: v1\nmodels:\n  - name: llmfaucet\n    provider: openai\n    model: ${options.defaultModel}\n    apiBase: ${options.baseURL}\n    apiKey: ${key}`,
    };
  if (agent === 'codex')
    return {
      agent,
      path: '.codex/config.toml',
      format: 'toml',
      content: `[model_providers.llmfaucet]\nname = "llmfaucet"\nbase_url = "${options.baseURL}"\nenv_key = "LLMFAUCET_API_KEY"\nwire_api = "responses"\nquery_params = {}\n\n[profiles.llmfaucet]\nmodel_provider = "llmfaucet"\nmodel = "${options.defaultModel}"`,
    };
  throw new Error(`Unsupported agent: ${agent}`);
}
