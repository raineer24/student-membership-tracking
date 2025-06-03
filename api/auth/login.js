const { prisma } = require("../../utils/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const handleCors = require("../../utils/cors").default;

module.exports.default = async function handler(req, res) {
  // ✅ CORS: Early return if it's a preflight OPTIONS request
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const student = await prisma.student.findFirst({ where: { userId: user.id } });

    const payload = {
      id: user.id,
      role: user.role.toUpperCase(),
      studentId: student?.id || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret-key", {
      expiresIn: "1d",
    });

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
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
