import assert from 'node:assert/strict';
import { MAINTENANCE_DELETE_BATCHES, MAINTENANCE_DELETE_BATCH_SIZE, scheduledMaintenance } from '../src/state';

const queries: string[] = [];
const deletes = new Map<string, number>([
  ['request_logs', MAINTENANCE_DELETE_BATCH_SIZE * MAINTENANCE_DELETE_BATCHES + 1],
  ['provider_health_history', 0],
  ['daily_stats', 0],
  ['provider_daily_stats', 0],
]);

const db = {
  prepare(sql: string) {
    queries.push(sql);
    return {
      bind(..._args: unknown[]) {
        return {
          async run() {
            if (!sql.startsWith('DELETE FROM')) return { meta: { changes: 1 } };
            const table = [...deletes.keys()].find((name) => sql.includes(`DELETE FROM ${name}`));
            if (!table) return { meta: { changes: 0 } };
            const remaining = deletes.get(table) ?? 0;
            const changes = Math.min(MAINTENANCE_DELETE_BATCH_SIZE, remaining);
            deletes.set(table, remaining - changes);
            return { meta: { changes } };
          },
        };
      },
    };
  },
} as any;

await scheduledMaintenance({ DB: db } as any);

assert.equal(queries.filter((query) => query.startsWith('INSERT INTO daily_stats')).length, 1);
assert.equal(queries.filter((query) => query.startsWith('DELETE FROM request_logs')).length, MAINTENANCE_DELETE_BATCHES);
assert.equal(queries.filter((query) => query.startsWith('DELETE FROM provider_health_history')).length, 1);
assert.equal(queries.filter((query) => query.startsWith('DELETE FROM daily_stats')).length, 1);
assert.equal(queries.filter((query) => query.startsWith('DELETE FROM provider_daily_stats')).length, 1);
assert.equal(deletes.get('request_logs'), 1);
console.log('state maintenance contract tests passed');
