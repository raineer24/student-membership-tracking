import prisma from "../../utils/db";
import { authenticate, authorizeRole } from "../../utils/auth";

export default async function handler(req, res) {
  const { method, query: { slug = [] } } = req;
  const user = await authenticate(req);

  const isAdmin = user?.role === 'ADMIN';

  try {
    // GET /api/memberships/me (Student)
    if (method === 'GET' && slug[0] === 'me') {
      const membership = await prisma.membership.findFirst({
        where: { student: { userId: user.id } },
      });
      return res.status(200).json(membership);
    }

    // GET /api/memberships (Admin)
    if (method === 'GET' && slug.length === 0) {
      authorizeRole('ADMIN', user);
      const memberships = await prisma.membership.findMany();
      return res.status(200).json(memberships);
    }

    // POST /api/memberships/create (Admin)
    if (method === 'POST' && slug[0] === 'create') {
      authorizeRole('ADMIN', user);
      const { studentId, startDate, type } = req.body;

      const start = new Date(startDate);
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const newMembership = await prisma.membership.create({
        data: { studentId, startDate: start, endDate: end, type },
      });

      return res.status(201).json(newMembership);
    }

    // Unsupported route
    return res.status(404).json({ error: 'Route not found' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
