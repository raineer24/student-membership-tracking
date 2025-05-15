// pages/api/api.js

const prisma = require('../utils/db');
const { authenticate } = require('../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);

    const url = req.url;
    const pathParts = url.split('/').filter(Boolean); // ['api', 'students', '1', 'payments']
    const route = pathParts[1]; // students, memberships, payments
    const id = pathParts[2] ? parseInt(pathParts[2]) : null;
    const subRoute = pathParts[3]; // payments, me, overdue, etc.

    // Admin Only Check
    const isAdmin = decoded.role === 'ADMIN';
    const isStudentOnly = !isAdmin && route === 'memberships' && subRoute === 'me';

    if (!isAdmin && !isStudentOnly) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Student Routes
    if (route === 'students') {
      if (subRoute === 'payments' && id) {
        const payments = await prisma.payment.findMany({
          where: { studentId: id }
        });

        return res.json(payments);
      }

      // GET /api/students/1/memberships
      if (subRoute === 'memberships' && id) {
        const membership = await prisma.membership.findFirst({
          where: { studentId: id }
        });

        return res.json(membership || {});
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Membership Routes
    if (route === 'memberships') {
      if (subRoute === 'me') {
        const student = await prisma.student.findUnique({
          where: { userId: decoded.id },
          include: { memberships: true }
        });

        return res.json(student?.memberships || []);
      }

      if (subRoute === 'overdue' && isAdmin) {
        const overdueStudents = await prisma.student.findMany({
          where: {
            memberships: {
              some: {
                endDate: { lt: new Date() }
              }
            }
          },
          include: { memberships: true }
        });

        return res.json(overdueStudents);
      }

      if (isAdmin && url.includes('/create') && method === 'POST') {
        let data;
        try {
          data = JSON.parse(req.body);
        } catch (e) {
          return res.status(400).json({ error: 'Malformed JSON' });
        }

        const { studentId, type, startDate } = data;

        const end = new Date(startDate);
        if (type === 'MONTHLY') end.setDate(end.getDate() + 30);
        else if (type === 'YEARLY') end.setFullYear(end.getFullYear() + 1);

        const membership = await prisma.membership.create({
          data: {
            studentId,
            type,
            startDate: new Date(startDate),
            endDate: end
          }
        });

        return res.status(201).json(membership);
      }
    }

    // Payment Routes
    if (route === 'payments') {
      if (id && subRoute === 'me') {
        const payments = await prisma.payment.findMany({
          where: { studentId: decoded.id }
        });

        return res.json(payments);
      }

      if (isAdmin && id && subRoute === undefined) {
        const payment = await prisma.payment.findUnique({ where: { id } });
        return res.json(payment || {});
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};