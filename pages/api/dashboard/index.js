import prisma from '../../../utils/db';
import { authenticate, authorize } from '../../../utils/auth';

export default async function handler(req, res) {
  try {
    const user = authenticate(req);
    authorize(user, 'admin');

    const [students, memberships, payments] = await Promise.all([
      prisma.student.count(),
      prisma.membership.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

    res.json({
      totalStudents: students,
      totalMemberships: memberships,
      totalPayments: payments._sum.amount || 0,
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
