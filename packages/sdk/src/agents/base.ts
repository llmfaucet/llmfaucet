import type { AgentAdapter, AgentConfig, AgentConfigOptions } from '../types/agent';

export abstract class BaseAdapter implements AgentAdapter {
  abstract readonly id: string;
  abstract readonly displayName: string;
  abstract generateConfig(options: AgentConfigOptions): AgentConfig;

  async detect(): Promise<boolean> {
    if (typeof process === 'undefined') return false;
    const fs = await import('node:fs/promises');
    const paths = this.detectionPaths();
    for (const path of paths) {
      try {
        await fs.access(path);
        return true;
      } catch {
        /* continue */
      }
    }
    return false;
  }

  protected detectionPaths(): string[] {
    return [];
  }
  protected options(options: AgentConfigOptions) {
    return options.customSettings ?? {};
  }
  protected json(config: unknown) {
    return JSON.stringify(config, null, 2) + '\n';
  }
}
