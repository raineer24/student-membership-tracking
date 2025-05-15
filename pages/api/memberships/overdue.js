// pages/api/memberships/overdue.js

const prisma = require("../../../utils/db");
const { authenticate } = require("../../../utils/auth");

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    if (req.method === "GET") {
      const today = new Date();

      const overdueStudents = await prisma.student.findMany({
        where: {
          memberships: {
            some: {
              endDate: {
                lt: today,
              },
            },
          },
        },
        include: {
          user: true,
          memberships: true,
        },
      });

      return res.json(overdueStudents);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
