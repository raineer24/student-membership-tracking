import {prisma } from "../../utils/db";
import { authenticate } from "../../utils/auth";
import bcrypt from "bcryptjs";
import { parse } from "url";

export default async function handler(req, res) {
  console.log("HANDLER HIT 🚀");
  console.log("req.url =", req.url);

  const parsedUrl = parse(req.url || "", true);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const slug = pathParts.length > 2 ? pathParts.slice(2) : [];

  console.log("Parsed slug:", slug);

  try {
    const decoded = await authenticate(req); // This decodes JWT

    const method = req.method;

    // ✅ STUDENT SELF VIEW: GET /api/students/me
    if (method === "GET" && slug[0] === "me") {
      if (!["STUDENT", "ADMIN"].includes(decoded.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const studentId = decoded.studentId;

      if (!studentId) {
        return res.status(404).json({ error: "Student not found" });
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

    // -----------------------------
    // 👤 Admin-Only Routes Below
    // -----------------------------

    // Ensure only admins proceed
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }

    // ✅ GET /api/students – List all students
    if (slug.length === 0 && method === "GET") {
      const students = await prisma.student.findMany({
        include: {
          user: true,
          memberships: true,
          payments: true,
        },
      });

      return res.json(students);
    }

    // ✅ GET /api/students/:id – View specific student
    if (slug.length === 1 && method === "GET") {
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

    // ✅ POST /api/students – Create new student
    if (slug.length === 0 && method === "POST") {
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

    // ✅ PUT /api/students/:id – Update student
    if (slug.length === 1 && method === "PUT") {
      const studentId = parseInt(slug[0], 10);

      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const { name, email, password } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true }
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      const updateStudentPromise = prisma.student.update({
        where: { id: studentId },
        data: { name, email }
      });

      let updatePasswordPromise = null;

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updatePasswordPromise = prisma.user.update({
          where: { id: student.userId },
          data: { password: hashedPassword }
        });
      }

      try {
        const [updatedStudent] = await Promise.all([
          updateStudentPromise,
          updatePasswordPromise
        ].filter(Boolean));

        return res.json(updatedStudent);
      } catch (err) {
        console.error("Error updating:", err);
        return res.status(500).json({ error: "Failed to update student" });
      }
    }

    // ✅ DELETE /api/students/:id – Delete student
    if (slug.length === 1 && method === "DELETE") {
      const studentId = parseInt(slug[0], 10);

      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true }
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      try {
        await prisma.student.delete({ where: { id: studentId } });
        await prisma.user.delete({ where: { id: student.userId } });

        return res.status(204).end();
      } catch (err) {
        console.error("Delete error:", err);
        return res.status(500).json({ error: "Failed to delete student" });
      }
    }

    // ❌ Method Not Allowed
    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: err.message });
  }
}