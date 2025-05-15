const prisma = require('../../../utils/db');
const { authenticate, authorizeRole } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const user = authenticate(req);
    authorizeRole(user, 'admin');

    const { id } = req.query;

    if (req.method === 'GET') {
      const student = await prisma.student.findUnique({
        where: { id: parseInt(id) },
        include: {
          memberships: true,
          payments: true,
        },
      });

      if (!student) return res.status(404).json({ error: 'Student not found' });

      // Update overdue status for memberships
      const now = new Date();
      for (const membership of student.memberships) {
        const isOverdue = membership.endDate < now;
        if (membership.overdue !== isOverdue) {
          await prisma.membership.update({
            where: { id: membership.id },
            data: { overdue: isOverdue },
          });
        }
      }

      return res.json(student);
    }

    if (req.method === 'PUT') {
      const { name, email } = req.body;
      const updatedStudent = await prisma.student.update({
        where: { id: parseInt(id) },
        data: { name, email },
      });
      return res.json(updatedStudent);
    }

    if (req.method === 'DELETE') {
      await prisma.student.delete({
        where: { id: parseInt(id) },
      });
      return res.status(204).end();
    }

    res.status(405).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
