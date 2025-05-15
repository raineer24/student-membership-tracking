const prisma = require("../../../utils/db");
const { authenticate, authorizeRole } = require("../../../utils/auth");

module.exports.default = async function handler(req, res) {
  const { id } = req.query;
  try {
    const decode = authenticate(req);
    if (decode.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }

    // GET Student by ID
    if (req.method === "GET") {
      const student = await prisma.student.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: true,
          memberships: true,
          payments: true,
        },
      });

      if (!student) return res.status(404).json({ error: "Student not found" });
      return res.json(student);
    }
    // PUT Update Student
    if (req.method === "PUT") {
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const updatedStudent = await prisma.student.update({
        where: { id: parseInt(id) },
        data: {
          name,
          email,
        },
      });

      return res.json(updatedStudent);
    }

    if (req.method === "DELETE") {
      await prisma.student.delete({ where: { id: parseInt(id) } });
      return res.status(204).json();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
