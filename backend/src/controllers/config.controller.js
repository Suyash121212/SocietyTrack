import { prisma } from '../db/prisma.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getConfigInt = async (key, defaultValue) => {
  const row = await prisma.appConfig.findUnique({ where: { key } });
  return row ? parseInt(row.value, 10) : defaultValue;
};

const setConfigInt = async (key, value) => {
  await prisma.appConfig.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
};

const validatePositiveInt = (value) => {
  const parsed = Number(value);
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }
  return parsed;
};

// ─── Overdue Days ─────────────────────────────────────────────────────────────

export const getOverdueDays = async (_req, res) => {
  const value = await getConfigInt('overdue_days', 7);
  return res.status(200).json({ value });
};

export const updateOverdueDays = async (req, res) => {
  const parsed = validatePositiveInt(req.body.value);
  if (!parsed) {
    return res.status(400).json({ error: 'value must be a positive integer (e.g. 7, 14, 30)' });
  }
  await setConfigInt('overdue_days', parsed);
  return res.status(200).json({ value: parsed });
};

// ─── Reopen Window Days ───────────────────────────────────────────────────────

export const getReopenDays = async (_req, res) => {
  const value = await getConfigInt('reopen_window_days', 3);
  return res.status(200).json({ value });
};

export const updateReopenDays = async (req, res) => {
  const parsed = validatePositiveInt(req.body.value);
  if (!parsed) {
    return res.status(400).json({ error: 'value must be a positive integer (e.g. 1, 3, 7)' });
  }
  await setConfigInt('reopen_window_days', parsed);
  return res.status(200).json({ value: parsed });
};

// ─── SLA Policies ─────────────────────────────────────────────────────────────

export const getSlaMatrix = async (_req, res) => {
  const policies = await prisma.slaPolicy.findMany({
    orderBy: [{ category: 'asc' }, { priority: 'asc' }],
  });
  return res.status(200).json(policies);
};

export const upsertSlaPolicy = async (req, res) => {
  const { category, priority, thresholdDays } = req.body;

  const VALID_CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];
  const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  if (priority !== null && priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')} or null` });
  }

  const days = validatePositiveInt(thresholdDays);
  if (!days) {
    return res.status(400).json({ error: 'thresholdDays must be a positive integer' });
  }

  const normalizedPriority = priority ?? null;

  let policy;
  if (normalizedPriority === null) {
    // Can't upsert on nullable unique in Prisma — delete-then-create
    await prisma.slaPolicy.deleteMany({ where: { category, priority: null } });
    policy = await prisma.slaPolicy.create({
      data: { category, priority: null, thresholdDays: days },
    });
  } else {
    policy = await prisma.slaPolicy.upsert({
      where:  { category_priority: { category, priority: normalizedPriority } },
      update: { thresholdDays: days },
      create: { category, priority: normalizedPriority, thresholdDays: days },
    });
  }

  return res.status(200).json(policy);
};
