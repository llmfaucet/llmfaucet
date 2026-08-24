import { rm } from 'node:fs/promises';

const generatedPaths = [
  'node_modules',
  '.next',
  'out',
  '.turbo',
  'dist',
  'build',
  'coverage',
  '.wrangler',
  'apps/web/tsconfig.tsbuildinfo',
];

await Promise.all(generatedPaths.map((path) => rm(path, { recursive: true, force: true })));

console.log(`Removed ${generatedPaths.length} generated paths.`);
