// pages/api/payments.js

const prisma = require('../../utils/db');
const { authenticate } = require('../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);

    const url = req.url;
    const isMeRoute = url.includes('/me');

    // GET /api/payments/me – Student Only
    if (isMeRoute && req.method === 'GET') {
      const student = await prisma.student.findUnique({
        where: { userId: decoded.id },
        include: { payments: true }
      });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.json(student.payments || []);
    }

    // Admin Routes

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }

    // GET /api/payments – Admin View All Payments
    if (req.method === 'GET') {
      const payments = await prisma.payment.findMany({
        include: { student: true }
      });

      return res.json(payments);
    }

    // POST /api/payments – Create Payment
    if (req.method === 'POST') {
      let data;
      try {
        data = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Malformed JSON' });
      }

      const { amount, studentId } = data;

      if (!amount || !studentId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const payment = await prisma.payment.create({
        data: {
          amount: parseFloat(amount),
          studentId: parseInt(studentId),
        }
      });

      return res.status(201).json(payment);
    }

    // PUT /api/payments/1 – Update Payment
    if (url.includes('/payments/') && req.method === 'PUT') {
      const id = parseInt(url.split('/')[3]);

      let data;
      try {
        data = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Malformed JSON' });
      }

      const { amount, studentId } = data;

      const updateData = {};
      if (amount) updateData.amount = parseFloat(amount);
      if (studentId) updateData.studentId = parseInt(studentId);

      const updated = await prisma.payment.update({
        where: { id },
        data: updateData
      });

      return res.json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};