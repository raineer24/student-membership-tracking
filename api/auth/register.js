const prisma = require("../../utils/db");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

module.exports.default = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
    

  try {
     const bodySchema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z.enum(["ADMIN", "STUDENT"], {
        errorMap: () => ({ message: "Role must be either ADMIN or STUDENT" }),
      }),
    });

    // Parse and validate request body
    const data = bodySchema.parse(req.body);

    //Convert role to uppercase (safe even if already uppercase);
    const role = data.role ? data.role.toUpperCase() : 'STUDENT';
    console.log('role', role);
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);


    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: role,
      },
    });

    if (role === "STUDENT") {
      await prisma.student.create({
        data: {
          name: data.name,
          email: data.email,
          userId: user.id,
        },
      });
    }

    return res.status(201).json(user);
  } catch (err) {
     // Handle Zod validation errors
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues[0].message });
    }

    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};