const prisma = require('../../../utils/db');
const { authenticate, authorizeRole } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decode = authenticate(req);
    if (decode.role !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden: Admin only' });

    if (req.method === 'GET') {
      const memberships = await prisma.membership.findMany({
        include: { student: true },
      });
      return res.json(memberships);
    }

    return res.status(405).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
