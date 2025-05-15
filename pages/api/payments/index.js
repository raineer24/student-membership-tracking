const prisma = require("../../../utils/db");
const { authenticate } = require("../../../utils/auth");

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    if (decoded.role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden: Admin only" });

    if (req.method === "GET") {
      const payments = await prisma.payment.findMany({
        include: { student: true },
      });
      return res.json(payments);
    }

    if (req.method === "POST") {
      if (!amount || !studentId)
        return res.status(400).json({ error: "Missing required fields" });

      const payment = await prisma.payment.create({
        data: {
          amount,
          studentId,
        },
      });

      return res.status(201).json(payment);
    }
     return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
