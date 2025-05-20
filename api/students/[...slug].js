const prisma = require("../../utils/db");
const { authenticate } = require("../../utils/auth");
const bcrypt = require("bcryptjs");

export default async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }

    const { slug = [] } = req.query;
    const method = req.method;

   // console.log("slug =", slug);

    // ✅ GET /api/students/:id
    if (slug && slug.length === 1 && method === "GET") {
      console.log("url =", req.url);
        console.log("slug =", slug);
      const studentId = parseInt(slug[0], 10);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

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

    // ✅ POST /api/students
    if ((!slug || slug.length === 0) && method === "POST") {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
        },
      });

      const student = await prisma.student.create({
        data: {
          name,
          email,
          userId: user.id,
        },
      });

      return res.status(201).json(student);
    }

    // ✅ GET /api/students
    if ((!slug || slug.length === 0) && method === "GET") {
      const students = await prisma.student.findMany({
        include: {
          user: true,
          memberships: true,
          payments: true,
        },
      });

      return res.json(students);
    }

    // ❌ If none matched
    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: err.message });
  }
}
