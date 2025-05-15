const prisma = require('../../../utils/db');
const { authenticate } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
    const { id } = req.query;
  try {
    const decoded = authenticate(req);
     if (decoded.role !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden: Admin only' })

     if (!amount && !studentId)
        return res.status(400).json({ error: 'No fields to update' });
     
     if (req.method === 'PUT') {
      const { amount, studentId } = req.body;

      const updatedPayment = await prisma.payment.update({
        where: { id: parseInt(id) },
        data: {
          amount,
          studentId
        },
      });

      return res.json(updatedPayment);
    }

    if (req.method === 'DELETE') {
      await prisma.payment.delete({ where: { id: parseInt(id) } });
      return res.status(204).json();
    }

    return res.status(405).json({ error: 'Method not allowed' });

    res.status(405).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
