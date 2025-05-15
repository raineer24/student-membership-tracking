const prisma = require('../../../utils/db');
const { authenticate, authorize } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const user = authenticate(req);
    authorize(user, 'admin');

    const { id } = req.query;

    if (req.method === 'PUT') {
      const { amount, paidAt } = req.body;

      const updated = await prisma.payment.update({
        where: { id: parseInt(id) },
        data: {
          amount,
          paidAt: new Date(paidAt),
        },
      });

      return res.json(updated);
    }

    res.status(405).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
