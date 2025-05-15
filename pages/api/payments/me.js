const prisma = require('../../../utils/db');
const {authenticate} = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decode = authenticate(req);

     // Only students can access this route
    if (decode.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Forbidden: Students only' });
    }

    const student = await prisma.student.findUnique({ where: { userId: decode.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
    });

    return res.json(payments);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
