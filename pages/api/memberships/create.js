const prisma = require('../../../utils/db');
const { authenticate, authorizeRole } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    authorizeRole('ADMIN', decoded);

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
