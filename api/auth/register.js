// Line 1-5: Import dependencies including CORS handler
const { prisma } = require("../../utils/db");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const handleCors = require("../../utils/cors").default; // ENHANCED: Added missing CORS import

// Line 6-30: NEW Philippine phone validation utilities
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

// Line 31-45: NEW Phone number formatting function
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

// Line 46-55: Main handler function with CORS support
module.exports.default = async function handler(req, res) {
  // Line 57-59: ENHANCED CORS handling - Early return for preflight OPTIONS
  if (handleCors(req, res)) return;

  // Line 61-64: Method validation
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Line 66-81: FIXED validation schema - corrected field names and phone syntax
    const schema = z.object({
      firstName: z.string().min(1, "First name is required"), // FIXED: was 'firstname'
      lastName: z.string().min(1, "Last name is required"), 
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z.enum(['admin', 'student']).optional().default('student'),
      phone: z.string()
        .optional() // FIXED: was .optional (missing parentheses)
        .refine((phone) => validatePhilippinePhone(phone), {
          message: 'Please enter a valid Philippine mobile number (+639XXXXXXXXX or 09XXXXXXXXX)'
        })
    });

    // Line 82-86: Parse and validate request body
    const data = schema.parse(req.body);
    console.log('Received data:', data); // DEBUG: Log parsed data

    // Line 88-91: Role normalization with safety check
    const role = data.role ? data.role.toUpperCase() : 'STUDENT';
    console.log('Processing registration for role:', role);

    // Line 93-99: ENHANCED Check for existing user with lowercase email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Line 100-103: Password hashing with proper salt rounds
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Line 105-107: FIXED Full name construction - corrected field name
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`; // FIXED: was data.firstname

    // Line 109-117: ENHANCED Create user with normalized email and full name
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: role,
      },
    });

    console.log('User created:', user.id); // DEBUG: Confirm user creation

    // Line 119-129: ENHANCED Create student record with formatted phone
    if (role === "STUDENT") {
      const student = await prisma.student.create({
        data: {
          name: fullName,
          email: data.email.toLowerCase(),
          phone: formatPhone(data.phone), // NEW: Format phone number
          userId: user.id,
        },
      });
      console.log('Student created:', student.id); // DEBUG: Confirm student creation
    }

    // Line 131-135: Return success response without sensitive data
    return res.status(201).json({
      success: true,
      message: 'Account created successfully'
    });

  } catch (err) {
    // Line 137-146: ENHANCED error handling with detailed logging
    console.error('Registration error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    // Line 147-152: Handle Zod validation errors with field info
    if (err.name === "ZodError") {
      console.error('Validation errors:', err.issues);
      return res.status(400).json({ 
        error: err.issues[0].message,
        field: err.issues[0].path[0] 
      });
    }

    // Line 153-157: Database constraint errors (Prisma P2002 = unique constraint)
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Line 158-162: Generic error response with better context
    return res.status(500).json({ 
      error: "Registration failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};