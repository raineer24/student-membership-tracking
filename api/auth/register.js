const { prisma } = require("../../utils/db");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

function validatePhilippinePhone(phone) {
  if (!phone || phone.trim() === '') return true; // Optional field
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, ''); // Remove formatting
  
  // Philippine mobile patterns: +639XXXXXXXXX, 09XXXXXXXXX, 639XXXXXXXXX
  const patterns = [
    /^\+639\d{9}$/,     // +639171234567
    /^09\d{9}$/,        // 09171234567  
    /^639\d{9}$/        // 639171234567
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

function formatPhone(phone) {
  if (!phone || phone.trim() === '') return null;
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('09')) {
    return '+63' + cleaned.slice(1); // 09171234567 → +639171234567
  }
  if (cleaned.startsWith('639')) {
    return '+' + cleaned; // 639171234567 → +639171234567
  }
  if (cleaned.startsWith('+639')) {
    return cleaned; // Already correct format
  }
  
  return phone; // Return as-is if unrecognized format
}

module.exports.default = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
    

  try {
     const schema = z.object({
      firstname: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
       role: z.enum(['admin', 'student']).optional().default('student'),
       phone: z.string()
       .optional
       .refine((phone) => validatePhilippinePhone(phone), {
        message: 'Please enter a valid Philippine mobile number (+639XXXXXXXXX or 09XXXXXXXXX)'
       })
    });

    // Parse and validate request body
    const data = schema.parse(req.body);

    //Convert role to uppercase (safe even if already uppercase);
    const role = data.role.toUpperCase();

    console.log('role', role);
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const fullName = `${data.firstname.trim()} ${data.lastName.trim()}`;

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: role,
      },
    });

    if (role === "STUDENT") {
      await prisma.student.create({
        data: {
          name: fullName,
          email: data.email.toLowerCase(),
          phone: formatPhone(data.phone),
          userId: user.id,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully'
    });
  } catch (err) {
console.error('Registration error:', err);
     // Handle Zod validation errors
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues[0].message });
    }

    console.error(err);
    return res.status(500).json({ error: "Registration failed" });
  }
};