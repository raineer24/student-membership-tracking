const prisma = require('../../../utils/db');
const { authenticate } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
    const { id } = req.query;
  try {
    const decoded = authenticate(req);
     if (decoded.role !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden: Admin only' })

    
    if (req.method === 'PUT') {
      const { amount, studentId } = req.body;

      const updated = await prisma.payment.update({
        where: { id: parseInt(id) },
        data: {
          amount,
          studentId
        },
      });

      return res.json(updated);
    }

    res.status(405).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
