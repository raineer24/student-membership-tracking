import prisma from '../../../utils/db';
import { authenticate } from '../../../utils/auth';

export default async function handler(req, res) {
  try {
    const user = authenticate(req);

    const student = await prisma.student.findUnique({ where: { id: user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
    });

    res.json(payments);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
