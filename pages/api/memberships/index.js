const prisma = require('../../../utils/db');
const { authenticate, authorize } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const user = authenticate(req);
    authorize(user, 'admin');

    if (req.method === 'GET') {
      const memberships = await prisma.membership.findMany({
        include: { student: true },
      });
      return res.json(memberships);
    }

    res.status(405).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
