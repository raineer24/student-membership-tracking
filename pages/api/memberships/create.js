const prisma = require("../../../utils/db");
const { authenticate, authorizeRole } = require("../../../utils/auth");

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    authorizeRole("ADMIN", decoded);

    if (req.method === "POST") {
      const { studentId, type, startDate, endDate } = req.body;

      if (!studentId || !type || !startDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: "Invalid start date format" });
      }

      const end = new Date(start);
      end.setDate(end.getDate() + 30);

      const membership = await prisma.membership.create({
        data: {
          studentId,
          type,
          startDate: start,
          endDate: end,
        },
      });

      return res.json(membership);
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
