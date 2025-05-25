// /api/auth/login.js

const { prisma } = require("../../utils/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports.default = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    console.log("🔍 Searching for user by email:", email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log(`❌ Password mismatch for user: ${user.email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 🧑‍🎓 Fetch associated Student
    const student = await prisma.student.findFirst({
      where: { userId: user.id },
    });

    // Optional: Admin logic only if you have an Admin model
    // const admin = await prisma.admin.findFirst({ where: { userId: user.id } });

    const payload = {
      id: user.id,
      role: user.role.toUpperCase(),
      studentId: student?.id || null,
      // adminId: admin?.id || null
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret-key", {
      expiresIn: "1d",
    });

    console.log(`🔑 Login successful for user: ${user.email}`);

    return res.json({
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: payload.role,
        studentId: payload.studentId,
      },
    });
  } catch (err) {
    console.error("🚨 Internal server error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};