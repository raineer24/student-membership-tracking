import prisma from "../../utils/db";
import { authenticate } from "../../utils/auth";

export default async function handler(req, res) {
  const { method } = req;

  // Parse full URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname; // 👈 Most reliable part

  console.log("RAW URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("METHOD:", method);
  console.log("QUERY:", req.query);
  console.log("USER ROLE:", (await authenticate(req))?.role);

  try {
    const user = await authenticate(req);

    // ✅ STUDENT: GET /api/memberships/me
    if (method === "GET" && pathname === "/api/memberships/me") {
      const membership = await prisma.membership.findFirst({
        where: { student: { userId: user.id } },
        include: { student: true },
      });

      if (!membership) {
        return res.status(404).json({ error: "Membership not found" });
      }

      return res.status(200).json(membership);
    }

    // ✅ ADMIN: GET /api/memberships/:studentId
    if (method === "GET" && pathname.startsWith("/api/memberships/")) {
      const parts = pathname.split("/");
      const maybeStudentId = parts[parts.length - 1];

      if (!isNaN(Number(maybeStudentId))) {
        const studentId = Number(maybeStudentId);

        if (user.role !== "ADMIN") {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const membership = await prisma.membership.findFirst({
          where: { studentId },
          include: { student: true },
        });

        if (!membership) {
          return res.status(404).json({ error: "Membership not found" });
        }

        return res.status(200).json(membership);
      }
    }

    // ✅ ADMIN: GET /api/memberships
    if (method === "GET" && pathname === "/api/memberships") {
      if (user.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const memberships = await prisma.membership.findMany({
        include: { student: true },
      });

      return res.status(200).json(memberships);
    }

    // ✅ ADMIN: POST /api/memberships/create
    if (method === "POST" && pathname === "/api/memberships/create") {
      if (user.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { studentId, type, startDate } = req.body;

      const start = new Date(startDate);
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

      const newMembership = await prisma.membership.create({
        data: {
          studentId,
          startDate: start,
          endDate: end,
          type,
        },
      });

      return res.status(201).json(newMembership);
    }

    // 🚫 Unsupported route
    return res.status(404).json({ error: "Route not found" });

  } catch (err) {
    if (err.message === "Authentication required") {
      return res.status(401).json({ error: "Authentication required" });
    }

    console.error("Unhandled Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}