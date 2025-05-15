const prisma = require("../../../utils/db");
const { authenticate } = require("../../utils/auth");

module.exports.default = async function handler(req, res) {
  const { id } = req.query;

  try {
    const decoded = authenticate(req);
    if (decoded.role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden: Admin only" });

     const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
    });

    return res.json(payments);
  } catch (error) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
