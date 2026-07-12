import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed default Admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@society.com' },
    update: {},
    create: {
      name: 'Society Admin',
      email: 'admin@society.com',
      password: hashedPassword,
      role: 'ADMIN',
      // flatNo is null for admin — no flat assigned
    },
  });

  console.log('[Seed] Admin user:', admin.email);

  // Seed default overdue_days config
  await prisma.appConfig.upsert({
    where: { key: 'overdue_days' },
    update: {},
    create: { key: 'overdue_days', value: '7' },
  });
  console.log('[Seed] AppConfig: overdue_days = 7');

  // Seed default reopen_window_days config
  await prisma.appConfig.upsert({
    where: { key: 'reopen_window_days' },
    update: {},
    create: { key: 'reopen_window_days', value: '3' },
  });
  console.log('[Seed] AppConfig: reopen_window_days = 3');

  // ── SLA Policy matrix ──────────────────────────────────────────────────────
  // category + priority → threshold_days
  // null priority = "any priority not covered by a more specific row"
  // These reflect realistic ops priorities: electrical/security issues resolve faster.
  const slaPolicies = [
    // ELECTRICAL
    { category: 'ELECTRICAL', priority: 'HIGH',   thresholdDays: 1 },
    { category: 'ELECTRICAL', priority: 'MEDIUM', thresholdDays: 3 },
    { category: 'ELECTRICAL', priority: 'LOW',    thresholdDays: 5 },
    { category: 'ELECTRICAL', priority: null,      thresholdDays: 3 },

    // PLUMBING
    { category: 'PLUMBING',   priority: 'HIGH',   thresholdDays: 2 },
    { category: 'PLUMBING',   priority: 'MEDIUM', thresholdDays: 5 },
    { category: 'PLUMBING',   priority: 'LOW',    thresholdDays: 7 },
    { category: 'PLUMBING',   priority: null,      thresholdDays: 5 },

    // SECURITY
    { category: 'SECURITY',   priority: 'HIGH',   thresholdDays: 1 },
    { category: 'SECURITY',   priority: 'MEDIUM', thresholdDays: 2 },
    { category: 'SECURITY',   priority: 'LOW',    thresholdDays: 4 },
    { category: 'SECURITY',   priority: null,      thresholdDays: 2 },

    // CLEANING
    { category: 'CLEANING',   priority: 'HIGH',   thresholdDays: 3 },
    { category: 'CLEANING',   priority: 'MEDIUM', thresholdDays: 7 },
    { category: 'CLEANING',   priority: 'LOW',    thresholdDays: 10 },
    { category: 'CLEANING',   priority: null,      thresholdDays: 7 },

    // OTHER
    { category: 'OTHER',      priority: 'HIGH',   thresholdDays: 3 },
    { category: 'OTHER',      priority: 'MEDIUM', thresholdDays: 7 },
    { category: 'OTHER',      priority: 'LOW',    thresholdDays: 14 },
    { category: 'OTHER',      priority: null,      thresholdDays: 7 },
  ];

  // Prisma can't upsert on a nullable composite unique — split into two passes.
  // Pass 1: non-null priority rows (standard upsert)
  for (const p of slaPolicies.filter((p) => p.priority !== null)) {
    await prisma.slaPolicy.upsert({
      where:  { category_priority: { category: p.category, priority: p.priority } },
      update: { thresholdDays: p.thresholdDays },
      create: p,
    });
  }

  // Pass 2: null-priority (category default) rows — delete-then-create is
  // the only reliable pattern for nullable unique fields in Prisma.
  for (const p of slaPolicies.filter((p) => p.priority === null)) {
    await prisma.slaPolicy.deleteMany({
      where: { category: p.category, priority: null },
    });
    await prisma.slaPolicy.create({ data: p });
  }

  console.log(`[Seed] SLA policies: ${slaPolicies.length} rows upserted`);
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
