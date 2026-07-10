import { prisma } from '../db/prisma.js';
import { sendImportantNoticeEmail } from '../services/email.service.js';

export const createNotice = async (req, res) => {
  const { title, body, isImportant } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!body) {
    return res.status(400).json({ error: 'body is required' });
  }

  const notice = await prisma.notice.create({
    data: {
      adminId: req.user.id,
      title,
      body,
      isImportant: isImportant === true || isImportant === 'true',
    },
    select: { id: true, title: true, body: true, isImportant: true, createdAt: true },
  });

  // Fire-and-forget email to all residents if important
  if (notice.isImportant) {
    const residents = await prisma.user.findMany({
      where: { role: 'RESIDENT' },
      select: { email: true },
    });
    const emails = residents.map((r) => r.email);
    sendImportantNoticeEmail(emails, title, body);
  }

  return res.status(201).json(notice);
};

export const getAllNotices = async (_req, res) => {
  const notices = await prisma.notice.findMany({
    orderBy: [
      { isImportant: 'desc' },
      { createdAt: 'desc' },
    ],
    select: { id: true, title: true, body: true, isImportant: true, createdAt: true },
  });

  return res.status(200).json(notices);
};

export const deleteNotice = async (req, res) => {
  const { id } = req.params;

  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) {
    return res.status(404).json({ error: 'Notice not found' });
  }

  await prisma.notice.delete({ where: { id } });

  return res.status(200).json({ message: 'Notice deleted' });
};
