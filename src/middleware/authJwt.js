const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next(new AppError("You are not logged in!", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return next(
      new AppError("You do not have permission to perfomr this action", 403)
    );
  }
  next();
};
exports.isTrainerOrAdmin = (req, res, next) => {
  if (req.user.role !== "TRAINER" && req.user.role !== "ADMIN") {
    return next(
      new AppError("You do not have permission to perfom this action", 403)
    );
  }
  next();
};
