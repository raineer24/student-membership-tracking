const prisma = require("../../utils/db");
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
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Fetch related student or admin ID
    const student = await prisma.student.findFirst({
      where: { userId: user.id }
    });

    const admin = await prisma.admin.findFirst({
      where: { userId: user.id }
    });

    const payload = {
      id: user.id,
      role: user.role,
      studentId: student?.id || null,
      adminId: admin?.id || null
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    return res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};