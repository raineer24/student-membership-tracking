const AppError = require("../utils/AppError");

exports.handleErrors = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    error: true,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
