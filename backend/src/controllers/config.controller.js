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
