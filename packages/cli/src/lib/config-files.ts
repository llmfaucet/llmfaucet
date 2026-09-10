import { chmod, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const dedicatedConfigPaths = new Set([
  '.aider.conf.yml',
  '.claude/settings.local.json',
  '.cline/llmfaucet.json',
  '.roo/llmfaucet.json',
  '.continue/config.yaml',
  '.continue/config.json',
  '.codex/config.toml',
]);

export function isDedicatedConfigPath(path: string) {
  return dedicatedConfigPaths.has(path);
}

export async function readConfig(path: string) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
export async function writeConfigFile(path: string, content: string, options: { force?: boolean } = {}) {
  const target = resolve(path);
  const existing = await readConfig(target);
  if (existing !== null && existing !== `${content.trim()}\n` && !options.force)
    throw new Error(`${target} already exists; pass --force to replace it`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${content.trim()}\n`, { mode: 0o600 });
  await chmod(target, 0o600);
  return target;
}
export async function removeConfigFile(path: string) {
  try {
    await unlink(resolve(path));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
