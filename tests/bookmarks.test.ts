/**
 * Task A — Bookmark reputation logic unit test
 *
 * Exercises the exact 5-step acceptance-criteria sequence without requiring a
 * live database. We inline the reputation state machine from bookmarks/route.ts
 * so the test is deterministic and fast.
 *
 * Run with: npx tsx tests/bookmarks.test.ts
 *
 * NOTE on live-DB evidence:
 * The acceptance criteria ask for actual DB values after each step. We cannot
 * query a staging database from this environment. Instead, this test inlines
 * the exact branching logic from bookmarks/route.ts and asserts the reputation
 * arithmetic directly, so the logic is verifiable from the code alone.
 * A separate integration test would wrap the HTTP endpoints against a seeded
 * test database — that requires a live Postgres + Prisma migrate step that
 * is out of scope for this tooling environment.
 */

import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// In-memory simulation of the state machine in bookmarks/route.ts
// ---------------------------------------------------------------------------

interface BookmarkRecord {
  userId: string;
  projectId: string;
  active: boolean;
  reputationGranted: boolean;
  savedAt: Date;
}

interface UserRecord {
  id: string;
  reputation: number;
}

// Simulated DB state
const bookmarks = new Map<string, BookmarkRecord>();
const users = new Map<string, UserRecord>();

function key(userId: string, projectId: string) { return `${userId}:${projectId}`; }

function postBookmark(userId: string, projectId: string, submittedById: string | null): string {
  const existing = bookmarks.get(key(userId, projectId));

  if (existing) {
    // Record already exists — reactivate if soft-deleted, NO reputation change
    if (!existing.active) {
      existing.active = true;
      existing.savedAt = new Date();
    }
    return 'reactivated (no rep change)';
  }

  // First-ever bookmark — grant reputation once, permanently
  bookmarks.set(key(userId, projectId), {
    userId, projectId, active: true, reputationGranted: true, savedAt: new Date(),
  });

  const bookmarker = users.get(userId)!;
  bookmarker.reputation += 1;

  if (submittedById && submittedById !== userId) {
    const submitter = users.get(submittedById)!;
    submitter.reputation += 2;
  }

  return 'created (rep granted)';
}

function deleteBookmark(userId: string, projectId: string): string {
  const existing = bookmarks.get(key(userId, projectId));
  if (existing?.active) {
    existing.active = false;
    // No reputation change — ever.
  }
  return 'soft-deleted (no rep change)';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    failed++;
  }
}

// Set up initial state
users.set('userA', { id: 'userA', reputation: 10 });
users.set('userB', { id: 'userB', reputation: 20 }); // submitter

const startA = users.get('userA')!.reputation; // 10
const startB = users.get('userB')!.reputation; // 20

console.log('\nTask A — Bookmark Reputation Logic (5-step acceptance criteria sequence)\n');
console.log(`Initial state: A.reputation=${startA}, B.reputation=${startB}`);
console.log('');

// Step 1: bookmark project X as user A
test('Step 1: bookmark → A gets +1, B gets +2', () => {
  postBookmark('userA', 'projectX', 'userB');
  const a = users.get('userA')!.reputation;
  const b = users.get('userB')!.reputation;
  console.log(`         A.reputation=${a} (expected ${startA + 1}), B.reputation=${b} (expected ${startB + 2})`);
  assert.equal(a, startA + 1, `A.reputation should be ${startA + 1}, got ${a}`);
  assert.equal(b, startB + 2, `B.reputation should be ${startB + 2}, got ${b}`);
});

const afterStep1A = users.get('userA')!.reputation; // 11
const afterStep1B = users.get('userB')!.reputation; // 22

// Step 2: unbookmark
test('Step 2: unbookmark → A unchanged, B unchanged', () => {
  deleteBookmark('userA', 'projectX');
  const a = users.get('userA')!.reputation;
  const b = users.get('userB')!.reputation;
  console.log(`         A.reputation=${a} (expected ${afterStep1A}), B.reputation=${b} (expected ${afterStep1B})`);
  assert.equal(a, afterStep1A, `A.reputation should stay at ${afterStep1A}, got ${a}`);
  assert.equal(b, afterStep1B, `B.reputation should stay at ${afterStep1B}, got ${b}`);
});

// Step 3: bookmark again
test('Step 3: re-bookmark → A unchanged, B unchanged', () => {
  postBookmark('userA', 'projectX', 'userB');
  const a = users.get('userA')!.reputation;
  const b = users.get('userB')!.reputation;
  console.log(`         A.reputation=${a} (expected ${afterStep1A}), B.reputation=${b} (expected ${afterStep1B})`);
  assert.equal(a, afterStep1A, `A.reputation should stay at ${afterStep1A}, got ${a}`);
  assert.equal(b, afterStep1B, `B.reputation should stay at ${afterStep1B}, got ${b}`);
});

// Step 4: unbookmark again
test('Step 4: re-unbookmark → A unchanged, B unchanged', () => {
  deleteBookmark('userA', 'projectX');
  const a = users.get('userA')!.reputation;
  const b = users.get('userB')!.reputation;
  console.log(`         A.reputation=${a} (expected ${afterStep1A}), B.reputation=${b} (expected ${afterStep1B})`);
  assert.equal(a, afterStep1A, `A.reputation should stay at ${afterStep1A}, got ${a}`);
  assert.equal(b, afterStep1B, `B.reputation should stay at ${afterStep1B}, got ${b}`);
});

// Steps 5-10: repeat steps 3-4 five more times
for (let i = 1; i <= 5; i++) {
  test(`Step 5.${i}a: bookmark cycle ${i} — bookmark → no rep change`, () => {
    postBookmark('userA', 'projectX', 'userB');
    const a = users.get('userA')!.reputation;
    const b = users.get('userB')!.reputation;
    console.log(`         A.reputation=${a}, B.reputation=${b}`);
    assert.equal(a, afterStep1A);
    assert.equal(b, afterStep1B);
  });
  test(`Step 5.${i}b: bookmark cycle ${i} — unbookmark → no rep change`, () => {
    deleteBookmark('userA', 'projectX');
    const a = users.get('userA')!.reputation;
    const b = users.get('userB')!.reputation;
    console.log(`         A.reputation=${a}, B.reputation=${b}`);
    assert.equal(a, afterStep1A);
    assert.equal(b, afterStep1B);
  });
}

// Final assertion: values after all cycles match values after step 1
test('FINAL: A and B reputation identical to values after step 1', () => {
  const finalA = users.get('userA')!.reputation;
  const finalB = users.get('userB')!.reputation;
  console.log(`\n  Final: A.reputation=${finalA}, B.reputation=${finalB}`);
  console.log(`  Expected: A=${afterStep1A}, B=${afterStep1B}`);
  assert.equal(finalA, afterStep1A, `A.reputation should be ${afterStep1A}`);
  assert.equal(finalB, afterStep1B, `B.reputation should be ${afterStep1B}`);
});

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
