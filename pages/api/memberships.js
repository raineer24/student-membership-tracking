// pages/api/memberships.js

const prisma = require('../../utils/db');
const { authenticate } = require('../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);

    // Extract path and method
    const url = req.url; // e.g., '/api/memberships/me'
    const isMeRoute = url.includes('me');
    const isOverdueRoute = url.includes('overdue');
    const isCreateRoute = req.method === 'POST' && url.includes('/create');

    // Handle GET /api/memberships/me
    if (isMeRoute && req.method === 'GET') {
      const student = await prisma.student.findUnique({
        where: { userId: decoded.id },
        include: { memberships: true }
      });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.json(student.memberships || []);
    }

    // Handle GET /api/memberships/overdue (Admin Only)
    if (isOverdueRoute && req.method === 'GET') {
      if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin only' });
      }

      const overdueStudents = await prisma.student.findMany({
        where: {
          memberships: {
            some: {
              endDate: {
                lt: new Date()
              }
            }
          }
        },
        include: {
          user: true,
          memberships: true
        }
      });

      return res.json(overdueStudents);
    }

    // Handle POST /api/memberships/create
    if (isCreateRoute) {
      let data;
      try {
        data = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }

      const { studentId, type, startDate } = data;

      if (!studentId || !type || !startDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const start = new Date(startDate);
      const end = new Date(start);

      if (type === 'MONTHLY') {
        end.setDate(end.getDate() + 30);
      } else if (type === 'YEARLY') {
        end.setFullYear(end.getFullYear() + 1);
      }

      const membership = await prisma.membership.create({
        data: {
          studentId: parseInt(studentId),
          type,
          startDate: start,
          endDate: end,
          isActive: true
        }
      });

      return res.status(201).json(membership);
    }

    // Handle Admin GET All Memberships
    if (req.method === 'GET' && !isMeRoute && !isOverdueRoute) {
      if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin only' });
      }

      const memberships = await prisma.membership.findMany({
        include: { student: true }
      });

      return res.json(memberships);
    }

    // Handle PUT /api/memberships/1/renew
    if (url.includes('/renew') && req.method === 'PUT') {
      const id = parseInt(url.split('/')[3]); // /api/memberships/1/renew → id = 1

      const data = JSON.parse(req.body);
      const { type, startDate } = data;

      const start = new Date(startDate);
      const end = type === 'MONTHLY' 
        ? new Date(start.getTime() + 30 * 86400000)
        : new Date(start.getTime() + 365 * 86400000);

      const updated = await prisma.membership.update({
        where: { id },
        data: {
          type,
          startDate: start,
          endDate: end
        }
      });

      return res.json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};