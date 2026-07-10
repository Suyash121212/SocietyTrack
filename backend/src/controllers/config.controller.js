import { prisma } from '../db/prisma.js';

export const getOverdueDays = async (_req, res) => {
  const config = await prisma.appConfig.findUnique({
    where: { key: 'overdue_days' },
  });

  const value = config ? parseInt(config.value, 10) : 7;
  return res.status(200).json({ value });
};

export const updateOverdueDays = async (req, res) => {
  const { value } = req.body;

  // Validate: must be a positive integer
  const parsed = Number(value);
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return res.status(400).json({
      error: 'value must be a positive integer (e.g. 7, 14, 30)',
    });
  }

  await prisma.appConfig.upsert({
    where: { key: 'overdue_days' },
    update: { value: String(parsed) },
    create: { key: 'overdue_days', value: String(parsed) },
  });

  return res.status(200).json({ value: parsed });
};
