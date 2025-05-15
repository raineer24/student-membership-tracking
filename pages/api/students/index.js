const prisma = require('../../../utils/db');
const { authenticate, authorizeRole } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decoded = await authenticate(req);
    authorizeRole('ADMIN', decoded);

    if (req.method === 'GET') {
      const students = await prisma.student.findMany({
        include: {
          memberships: true,
          payments: true,
        },
      });

      // Update overdue status for memberships
      const now = new Date();
      for (const student of students) {
        for (const membership of student.memberships) {
          const isOverdue = membership.endDate < now;
          if (membership.overdue !== isOverdue) {
            await prisma.membership.update({
              where: { id: membership.id },
              data: { overdue: isOverdue },
            });
          }
        }
      }

      return res.json(students);
    }

    if (req.method === 'POST') {
      const { name, email } = req.body;
      const student = await prisma.student.create({
        data: { name, email },
      });
      return res.json(student);
    }

    res.status(405).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
