const jwt = require("jsonwebtoken");

module.exports.default = async function authenticate(req) {
  const auth = req.headers.authorization;
  if (!auth) throw new Error('No token');
  const token = auth.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports.default = async function authorize(user, role) {
  if (user.role !== role) throw new Error('Forbidden');
}
