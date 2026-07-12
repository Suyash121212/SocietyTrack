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
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
