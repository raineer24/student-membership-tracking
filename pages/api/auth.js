// pages/api/auth.js

const bcrypt = require('bcryptjs');
const prisma = require('../../utils/db');

module.exports.default = async function handler(req, res) {
  const url = req.url;
  const method = req.method;

  if (method === 'POST') {
    if (url.includes('/login')) {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({ token });
    }

    if (url.includes('/register')) {
      // Handle student or admin registration logic
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};