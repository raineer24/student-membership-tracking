import prisma from '../../../utils/db';
import { authenticate, authorize } from '../../../utils/auth';

export default async function handler(req, res) {
  try {
    const user = authenticate(req);
    authorize(user, 'admin');

    if (req.method === 'POST') {
      const { studentId, type, startDate, endDate } = req.body;

      const membership = await prisma.membership.create({
        data: {
          studentId,
          type,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      });

      return res.json(membership);
    }

    res.status(405).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
