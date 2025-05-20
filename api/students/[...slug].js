// /api/students/[...slug].js
const prisma = require("../../utils/db");
const { authenticate } = require("../../utils/auth");

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }

    const { slug } = req.query;

    // GET /api/students
    if (!slug || slug.length === 0) {
      if (req.method === "GET") {
        const students = await prisma.student.findMany({
          include: {
            user: true,
            memberships: true,
            payments: true,
          },
        });

        return res.json(students);
      }
    }

    // Handle nested routes: /api/students/:id
    if (slug && slug.length >= 1) {
      const studentId = parseInt(slug[0], 10);

      // GET /api/students/31
      if (req.method === "GET" && slug.length === 1) {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            user: true,
            memberships: true,
            payments: true,
          },
        });

        if (!student) {
          return res.status(404).json({ error: "Student not found" });
        }

        return res.json(student);
      }

      // Add PUT, DELETE, or nested routes like payments here later
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: err.message });
  }
};