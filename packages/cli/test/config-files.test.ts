import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isDedicatedConfigPath, readConfig, removeConfigFile, writeConfigFile } from '../src/lib/config-files';
describe('config files', () => {
  it('writes and reads nested files', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'llmfaucet-'));
    const path = join(cwd, '.config', 'file');
    await writeConfigFile(path, 'value');
    expect(await readConfig(path)).toBe('value\n');
  });
  it('does not overwrite without force', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'llmfaucet-'));
    const path = join(cwd, 'config');
    await writeConfigFile(path, 'one');
    await expect(writeConfigFile(path, 'two')).rejects.toThrow('pass --force');
  });

  it('only suppresses missing-file removal errors', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'llmfaucet-'));
    expect(await removeConfigFile(join(cwd, 'missing'))).toBe(false);
  });

  it('does not treat shared agent settings as removable generated files', () => {
    expect(isDedicatedConfigPath('.vscode/settings.json')).toBe(false);
    expect(isDedicatedConfigPath('.claude/settings.json')).toBe(false);
    expect(isDedicatedConfigPath('.claude/settings.local.json')).toBe(true);
  });
});
