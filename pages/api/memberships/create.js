const prisma = require("../../../utils/db");
const { authenticate, authorizeRole } = require("../../../utils/auth");

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }
    if (req.method === "POST") {
      const { studentId, type, startDate } = req.body;

      if (!studentId || !type || !startDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + (type === "MONTHLY" ? 30 : 365));

      const membership = await prisma.membership.create({
        data: {
          type,
          startDate: start,
          endDate: end,
          isActive: true,
          studentId: studentId,
        },
      });

      return res.json(membership);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
