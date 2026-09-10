import { Command } from 'commander';
import { setupCommand } from './commands/setup';
import { doctorCommand } from './commands/doctor';
import { statusCommand } from './commands/status';
import { configCommand } from './commands/config';
import { initCommand } from './commands/init';
export const program = new Command()
  .name('llmfaucet')
  .description('llmfaucet setup, diagnostics, and agent configuration')
  .version('0.1.0')
  .addCommand(setupCommand)
  .addCommand(doctorCommand)
  .addCommand(statusCommand)
  .addCommand(configCommand)
  .addCommand(initCommand);
await program.parseAsync();
