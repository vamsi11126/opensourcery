/**
 * Demonstrates Task B: rate-limit.ts throws at module load time in production
 * when Upstash env vars are missing.
 *
 * Run with: npx tsx tests/rate-limit-production-guard.ts
 *
 * This script directly patches the environment BEFORE the module loads,
 * then verifies the throw using a try/catch around require().
 */

// Patch env BEFORE any import of rate-limit.ts
// NODE_ENV is typed as read-only in process.env, but at runtime it's mutable.
// We use Object.defineProperty so TypeScript doesn't complain.
Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true });
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

console.log('Environment set:');
console.log(`  NODE_ENV                  = ${process.env.NODE_ENV}`);
console.log(`  UPSTASH_REDIS_REST_URL    = ${process.env.UPSTASH_REDIS_REST_URL ?? '(unset)'}`);
console.log(`  UPSTASH_REDIS_REST_TOKEN  = ${process.env.UPSTASH_REDIS_REST_TOKEN ?? '(unset)'}`);
console.log('');

// tsx transpiles TypeScript on-the-fly, so we can require() the .ts file
// directly. We use a dynamic require to keep this catchable.
let threw = false;
let errorMessage = '';

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../src/lib/rate-limit');
} catch (err) {
  threw = true;
  errorMessage = (err as Error).message;
}

if (threw) {
  console.log('Module load result: THREW (expected in production)');
  console.log('Error message:', errorMessage);
  console.log('');
  console.log('✓ rate-limit.ts correctly refuses to start in production without required env vars.');
  process.exit(0);
} else {
  console.error('FAIL: module loaded without throwing — fail-closed guard is broken!');
  process.exit(1);
}
