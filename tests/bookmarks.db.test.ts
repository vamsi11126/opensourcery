import { db } from '../src/lib/db';
import assert from 'node:assert/strict';

async function run() {
  console.log('--- Task A: Running against live Neon DB ---');

  // Clean up any old test data
  const testEmailA = `test-user-a-${Date.now()}@example.com`;
  const testEmailB = `test-user-b-${Date.now()}@example.com`;
  const testProjectSlug = `test-project-${Date.now()}`;

  const userA = await db.user.create({
    data: { name: 'User A', email: testEmailA, reputation: 10 },
  });
  const userB = await db.user.create({
    data: { name: 'User B', email: testEmailB, reputation: 20 },
  });
  const projectX = await db.project.create({
    data: {
      title: 'Project X',
      slug: testProjectSlug,
      shortDescription: 'Test Project',
      sourceUrl: `https://github.com/test/${testProjectSlug}`,
      submittedById: userB.id,
      status: 'APPROVED',
    },
  });

  async function getReps() {
    const freshA = await db.user.findUniqueOrThrow({ where: { id: userA.id } });
    const freshB = await db.user.findUniqueOrThrow({ where: { id: userB.id } });
    return { a: freshA.reputation, b: freshB.reputation };
  }

  // Exact bookmark logic from route.ts
  async function bookmark(userId: string, projectId: string) {
    const existing = await db.userSavedProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (existing) {
      if (!existing.active) {
        await db.userSavedProject.update({
          where: { userId_projectId: { userId, projectId } },
          data: { active: true, savedAt: new Date() },
        });
      }
      return;
    }

    const proj = await db.project.findUnique({
      where: { id: projectId },
      select: { submittedById: true },
    });

    await db.userSavedProject.create({
      data: {
        userId,
        projectId,
        active: true,
        reputationGranted: true,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: { reputation: { increment: 1 } },
    });

    if (proj?.submittedById && proj.submittedById !== userId) {
      await db.user.update({
        where: { id: proj.submittedById },
        data: { reputation: { increment: 2 } },
      });
    }
  }

  // Exact unbookmark logic from route.ts
  async function unbookmark(userId: string, projectId: string) {
    const existing = await db.userSavedProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (existing?.active) {
      await db.userSavedProject.update({
        where: { userId_projectId: { userId, projectId } },
        data: { active: false },
      });
    }
  }

  const start = await getReps();
  console.log(`Initial DB State: User A reputation = ${start.a}, User B (submitter) reputation = ${start.b}`);

  // Step 1: bookmark project X as user A
  await bookmark(userA.id, projectX.id);
  const step1 = await getReps();
  console.log(`Step 1 (Bookmark): User A reputation = ${step1.a}, User B reputation = ${step1.b}`);
  assert.equal(step1.a, start.a + 1);
  assert.equal(step1.b, start.b + 2);

  // Step 2: unbookmark
  await unbookmark(userA.id, projectX.id);
  const step2 = await getReps();
  console.log(`Step 2 (Unbookmark): User A reputation = ${step2.a}, User B reputation = ${step2.b}`);
  assert.equal(step2.a, step1.a);
  assert.equal(step2.b, step1.b);

  // Step 3: bookmark again
  await bookmark(userA.id, projectX.id);
  const step3 = await getReps();
  console.log(`Step 3 (Bookmark again): User A reputation = ${step3.a}, User B reputation = ${step3.b}`);
  assert.equal(step3.a, step1.a);
  assert.equal(step3.b, step1.b);

  // Step 4: unbookmark again
  await unbookmark(userA.id, projectX.id);
  const step4 = await getReps();
  console.log(`Step 4 (Unbookmark again): User A reputation = ${step4.a}, User B reputation = ${step4.b}`);
  assert.equal(step4.a, step1.a);
  assert.equal(step4.b, step1.b);

  // Step 5: repeat steps 3-4 five more times
  for (let i = 1; i <= 5; i++) {
    await bookmark(userA.id, projectX.id);
    const repAfterBm = await getReps();
    console.log(`Step 5.${i}a (Cycle ${i} Bookmark): User A reputation = ${repAfterBm.a}, User B reputation = ${repAfterBm.b}`);
    assert.equal(repAfterBm.a, step1.a);
    assert.equal(repAfterBm.b, step1.b);

    await unbookmark(userA.id, projectX.id);
    const repAfterUnbm = await getReps();
    console.log(`Step 5.${i}b (Cycle ${i} Unbookmark): User A reputation = ${repAfterUnbm.a}, User B reputation = ${repAfterUnbm.b}`);
    assert.equal(repAfterUnbm.a, step1.a);
    assert.equal(repAfterUnbm.b, step1.b);
  }

  const finalReps = await getReps();
  console.log(`Final DB Verification: User A reputation = ${finalReps.a} (expected ${step1.a}), User B reputation = ${finalReps.b} (expected ${step1.b})`);
  assert.equal(finalReps.a, step1.a);
  assert.equal(finalReps.b, step1.b);

  // Clean up
  await db.userSavedProject.deleteMany({ where: { projectId: projectX.id } });
  await db.project.delete({ where: { id: projectX.id } });
  await db.user.delete({ where: { id: userA.id } });
  await db.user.delete({ where: { id: userB.id } });

  console.log('--- All DB assertions passed successfully! ---');
  await db.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
