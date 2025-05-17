// /api/students.js
const prisma = require("../utils/db");
const authenticate = require("../utils/auth");
const bcrypt = require("bcryptjs");

export default async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }

    // Extract dynamic path segments
    const { slug } = req.query;
    const method = req.method;

    // GET /api/students
    if (!slug && method === "GET") {
      const students = await prisma.student.findMany({
        include: {
          user: true,
          memberships: true,
          payments: true,
        },
      });

      return res.json(students);
    }

    // POST /api/students
    if (!slug && method === "POST") {
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

    // Handle routes with ID
    if (slug && slug.length >= 1) {
      const studentId = parseInt(slug[0], 10);

      // GET /api/students/1
      if (method === "GET" && slug.length === 1) {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            user: true,
            memberships: true,
            payments: true,
          },
        });

        if (!student) return res.status(404).json({ error: "Student not found" });
        return res.json(student);
      }

      // PUT /api/students/1
      if (method === "PUT" && slug.length === 1) {
        const { name, email } = req.body;

        if (!name || !email) {
          return res.status(400).json({ error: "Name and email are required" });
        }

        const updatedStudent = await prisma.student.update({
          where: { id: studentId },
          data: { name, email },
        });

        return res.json(updatedStudent);
      }

      // DELETE /api/students/1
      if (method === "DELETE" && slug.length === 1) {
        await prisma.student.delete({ where: { id: studentId } });
        return res.status(204).json();
      }

      // GET /api/students/1/payments
      if (slug.length === 2 && slug[1] === "payments") {
        const payments = await prisma.payment.findMany({
          where: { studentId },
        });

        return res.json(payments);
      }
    }

    // Method not allowed
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: err.message });
  }
}