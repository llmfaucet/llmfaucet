import pc from 'picocolors';
export const output = {
  intro: (value: string) => console.log(pc.bold(`\n${value}`)),
  success: (value: string) => console.log(pc.green(`✓ ${value}`)),
  info: (value: string) => console.log(pc.dim(value)),
  warn: (value: string) => console.warn(pc.yellow(`! ${value}`)),
  error: (value: string) => console.error(pc.red(`✗ ${value}`)),
  line: () => console.log(),
};
