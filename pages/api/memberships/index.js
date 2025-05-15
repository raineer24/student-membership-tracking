const prisma = require('../../../utils/db');
const { authenticate, authorizeRole } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decode = authenticate(req);
    authorizeRole('ADMIN', decode);

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
