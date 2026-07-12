import { prisma } from '../db/prisma.js';
import { sendImportantNoticeEmail } from '../services/email.service.js';

const NOTICE_SELECT = {
  id:          true,
  title:       true,
  body:        true,
  isImportant: true,
  validUntil:  true,
  createdAt:   true,
};

export const createNotice = async (req, res) => {
  const { title, body, isImportant, validUntil } = req.body;

  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!body)  return res.status(400).json({ error: 'body is required' });

  // Validate validUntil if provided — must be a future date
  let validUntilDate = null;
  if (validUntil) {
    validUntilDate = new Date(validUntil);
    if (isNaN(validUntilDate.getTime())) {
      return res.status(400).json({ error: 'validUntil must be a valid ISO date string' });
    }
    if (validUntilDate <= new Date()) {
      return res.status(400).json({ error: 'validUntil must be in the future' });
    }
  }

  const notice = await prisma.notice.create({
    data: {
      adminId:    req.user.id,
      title,
      body,
      isImportant: isImportant === true || isImportant === 'true',
      validUntil:  validUntilDate,
    },
    select: NOTICE_SELECT,
  });

  if (notice.isImportant) {
    const residents = await prisma.user.findMany({
      where:  { role: 'RESIDENT' },
      select: { email: true },
    });
    sendImportantNoticeEmail(residents.map((r) => r.email), title, body);
  }

  return res.status(201).json(notice);
};

export const getAllNotices = async (_req, res) => {
  const now = new Date();

  const notices = await prisma.notice.findMany({
    where: {
      // Auto-hide notices whose validity window has passed.
      // validUntil = null means the notice never expires.
      OR: [
        { validUntil: null },
        { validUntil: { gt: now } },
      ],
    },
    orderBy: [
      { isImportant: 'desc' },
      { createdAt:   'desc' },
    ],
    select: NOTICE_SELECT,
  });

  return res.status(200).json(notices);
};

export const deleteNotice = async (req, res) => {
  const { id } = req.params;

  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) return res.status(404).json({ error: 'Notice not found' });

  await prisma.notice.delete({ where: { id } });
  return res.status(200).json({ message: 'Notice deleted' });
};
