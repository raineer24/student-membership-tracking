const prisma = require("../../../utils/db");
const authenticate = require("../../../utils/auth");
const authorizeRole = require("../../../utils/authorizeRole");


module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    authorizeRole("ADMIN")(decoded);

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

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};