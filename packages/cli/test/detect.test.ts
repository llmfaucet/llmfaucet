import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectAgent } from '../src/lib/detect';
describe('detectAgent', () =>
  it('detects aider from a project file', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'llmfaucet-'));
    await writeFile(join(cwd, '.aider.conf.yml'), '');
    expect((await detectAgent(cwd))?.name).toBe('aider');
  }));
