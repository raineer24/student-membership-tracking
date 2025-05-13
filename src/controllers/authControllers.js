const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const AppError = require("../utils/AppError");

exports.signup = async (req, resizeBy, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError("Email already exists", 400));
    }
    const user = await prisma.user.create({
      data: { name, email, password, role },
    });
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user || user.password !== password) {
        return next(new AppError('Invalid credentials', 401));
    }
    const token = jwt.sign(
        {id: user.id, email: user.email, role: user.role},
        process.env.JWT_SECRET,
        {expiresIn: '24h'}
    );
    res.json({token});
  } catch (error) {
    next(err);
  }
};
