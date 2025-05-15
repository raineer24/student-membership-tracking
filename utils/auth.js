const jwt = require("jsonwebtoken");

export function authenticate(req) {
  const auth = req.headers.authorization;
  if (!auth) throw new Error('No token');
  const token = auth.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function authorize(user, role) {
  if (user.role !== role) throw new Error('Forbidden');
}
