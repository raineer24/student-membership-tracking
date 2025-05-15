const prisma = require("../../../utils/db");
const { authenticate, authorizeRole } = require("../../../utils/auth");
const bcrypt = require("bcryptjs");

module.exports.default = async function handler(req, res) {
  try {
    const decoded = await authenticate(req);
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }

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

    if (req.method === "POST") {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Creates User first
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
        },
      });

      // Then create Student linked to that user
      const student = await prisma.student.create({
        data: {
          name,
          email,
          userId: user.id,
        },
      });

      return res.status(201).json(student);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
