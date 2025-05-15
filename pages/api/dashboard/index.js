// pages/api/dashboard/index.js

const prisma = require('../../../utils/db');
const { authenticate } = require('../../../utils/auth');

module.exports.default = async function handler(req, res) {
  try {
    const decoded = authenticate(req);
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }

    if (req.method === 'GET') {
      // Total students
      const totalStudents = await prisma.student.count();

      // Active memberships (any membership where endDate > today)
      const activeMemberships = await prisma.membership.count({
        where: {
          endDate: {
            gt: new Date(),
          },
        },
      });

      // Overdue students — those who have at least one expired membership
      const overdueCount = await prisma.student.count({
        where: {
          memberships: {
            some: {
              endDate: {
                lt: new Date(),
              },
            },
          },
        },
      });

      // Optional: Get all overdue students with data
      const overdueStudents = await prisma.student.findMany({
        where: {
          memberships: {
            some: {
              endDate: {
                lt: new Date(),
              },
            },
          },
        },
        include: {
          user: true,
          memberships: {
            where: {
              endDate: {
                lt: new Date(),
              },
            },
            select: {
              id: true,
              type: true,
              endDate: true
            }
          }
        }
      });

      // Build dashboard response
      const stats = {
        totalStudents,
        activeMemberships,
        overdueCount,
        overdueStudents,
      };

      return res.json(stats);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};