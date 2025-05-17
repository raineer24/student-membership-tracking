const prisma = require("../../utils/db");
const bcrypt = require("bcryptjs");

module.exports.default = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    if (role === "STUDENT") {
      await prisma.student.create({
        data: {
          name,
          email,
          userId: user.id,
        },
      });
    }

    return res.status(201).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};