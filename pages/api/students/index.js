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
