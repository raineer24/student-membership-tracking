// api/students/[[...slug]].js - MINIMAL WORKING VERSION
import { prisma } from "../../utils/db";
import { authenticate } from "../../utils/auth";
import { parse } from "url";

export default async function handler(req, res) {
  console.log("✅ Students API Minimal:", req.method, req.url);

  try {
    const parsedUrl = parse(req.url || "", true);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const slug = pathParts.length > 2 ? pathParts.slice(2) : [];

    const decoded = await authenticate(req);
    const method = req.method;

    // STUDENT ENDPOINT: /api/students/me (STUDENTS ONLY)
    if (method === "GET" && slug[0] === "me") {
      if (decoded.role !== "STUDENT") {
        return res.status(403).json({ 
          error: "Students only - Use /api/students for admin access"
        });
      }

      const studentId = decoded.studentId;
      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId in token" });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { id: true, email: true, role: true } },
          memberships: true,
          payments: true,
        },
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.json(student);
    }

    // ADMIN ENDPOINTS BELOW
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // GET /api/students - List all students (ADMIN ONLY)
    if (slug.length === 0 && method === "GET") {
      console.log("📋 Admin fetching all students...");

      const students = await prisma.student.findMany({
        include: {
          user: {
            select: { id: true, email: true, role: true }
          },
          memberships: true,
          payments: {
            orderBy: { id: 'desc' },
            take: 3
          },
        },
        orderBy: { id: 'desc' }  // Use id instead of createdAt
      });

      console.log(`✅ Found ${students.length} students`);

      // Add computed status
      const studentsWithStatus = students.map(student => {
        const activeMembership = student.memberships.find(m => 
          m.isActive && new Date(m.endDate) > new Date()
        );
        
        return {
          ...student,
          status: activeMembership ? 'ACTIVE' : 'EXPIRED',
          activeMembership
        };
      });

      return res.json(studentsWithStatus);
    }

    // GET /api/students/:id - Get specific student (ADMIN ONLY)
    if (slug.length === 1 && method === "GET") {
      const studentId = parseInt(slug[0], 10);

      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { id: true, email: true, role: true } },
          memberships: { orderBy: { id: 'desc' } },
          payments: { orderBy: { id: 'desc' } },
        },
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.json(student);
    }

    // POST /api/students - Create new student (ADMIN ONLY)
    if (slug.length === 0 && method === "POST") {
      const { name, email, phone, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ 
          error: "Missing required fields: name, email, password" 
        });
      }

      // Check if email exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({ 
          error: "Email already exists" 
        });
      }

      // Create user and student in transaction
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "STUDENT",
          },
        });

        const student = await tx.student.create({
          data: {
            name,
            phone: phone || null,
            email, // Add email to student model
            userId: user.id,
          },
          include: {
            user: { select: { id: true, email: true, role: true } }
          }
        });

        return student;
      });

      return res.status(201).json(result);
    }

    // PUT /api/students/:id - Update student (ADMIN ONLY)
    if (slug.length === 1 && method === "PUT") {
      const studentId = parseInt(slug[0], 10);
      const { name, phone, email } = req.body;

      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      console.log(`📝 Updating student ${studentId}:`, { name, phone, email });

      try {
        // Update student and optionally user email
        const updateData = {
          name,
          phone,
          ...(email && { email }) // Update student email if provided
        };

        const updatedStudent = await prisma.student.update({
          where: { id: studentId },
          data: updateData,
          include: {
            user: { select: { id: true, email: true, role: true } },
            memberships: true,
            payments: { take: 3, orderBy: { id: 'desc' } }
          }
        });

        // Also update user email if provided
        if (email && updatedStudent.userId) {
          await prisma.user.update({
            where: { id: updatedStudent.userId },
            data: { email, name }
          });
        }

        console.log(`✅ Student ${studentId} updated successfully`);
        return res.json(updatedStudent);

      } catch (updateError) {
        if (updateError.code === 'P2002') {
          return res.status(409).json({ 
            error: "Email already exists" 
          });
        }
        throw updateError;
      }
    }

    // DELETE /api/students/:id - Delete student (ADMIN ONLY)
    if (slug.length === 1 && method === "DELETE") {
      const studentId = parseInt(slug[0], 10);

      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      console.log(`🗑️ Deleting student ${studentId}`);

      try {
        // Get student first to get userId
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: { userId: true, name: true }
        });

        if (!student) {
          return res.status(404).json({ error: "Student not found" });
        }

        // Delete in transaction (student first, then user)
        await prisma.$transaction(async (tx) => {
          await tx.student.delete({
            where: { id: studentId }
          });

          if (student.userId) {
            await tx.user.delete({
              where: { id: student.userId }
            });
          }
        });

        console.log(`✅ Student ${student.name} deleted successfully`);
        return res.json({
          message: "Student deleted successfully",
          deletedStudent: { id: studentId, name: student.name }
        });

      } catch (deleteError) {
        if (deleteError.code === 'P2003') {
          return res.status(400).json({ 
            error: "Cannot delete student with existing memberships or payments" 
          });
        }
        throw deleteError;
      }
    }

    // Method not supported
    return res.status(405).json({ 
      error: `Method ${method} not allowed`,
      supported: ["GET", "POST", "PUT", "DELETE"]
    });

  } catch (error) {
    console.error("❌ Students API Error:", error.message);

    // Auth errors
    if (error.message.includes("token") || error.message.includes("Authentication")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Prisma errors
    if (error.code?.startsWith('P')) {
      return res.status(500).json({ 
        error: "Database error",
        code: error.code
      });
    }

    // Generic error
    return res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong"
    });
  }
}