/**
 * One-off admin promotion script.
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts someone@example.com
 *
 * This script is intentionally not imported by any route file.
 * It must only be run manually by a trusted operator with database access.
 */
import { db } from '../src/lib/db';

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();

  if (!email || !email.includes('@')) {
    console.error('Usage: npx tsx scripts/promote-admin.ts <email>');
    process.exit(1);
  }

  const existing = await db.user.findUnique({ where: { email }, select: { id: true, role: true, name: true } });
  if (!existing) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  if (existing.role === 'ADMIN') {
    console.log(`User "${existing.name ?? email}" is already ADMIN. No change made.`);
    process.exit(0);
  }

  const updated = await db.user.update({
    where: { email },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`✓ Promoted user to ADMIN:`);
  console.log(`  ID:    ${updated.id}`);
  console.log(`  Name:  ${updated.name ?? '(none)'}`);
  console.log(`  Email: ${updated.email}`);
  console.log(`  Role:  ${updated.role}`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
