const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const z = require("zod");
const prisma = require("../../../utils/db");

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "student"]).optional(),
});

module.exports.default = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const data = schema.parse(req.body);
    const role = (data.role || "student").toUpperCase();
    const hashed = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        role: role,
      },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
