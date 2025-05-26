import { prisma } from "../../utils/db";
import { authenticate } from "../../utils/auth";

export default async function handler(req, res) {
  const { method } = req;

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;

  // Normalize path
  if (pathname.endsWith("/") && pathname.length > 1) {
    pathname = pathname.slice(0, -1);
  }

  console.log("RAW URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("METHOD:", method);
  console.log("QUERY:", req.query);

  try {
    const decoded = await authenticate(req);
    console.log("USER ROLE:", decoded.role);

    // ✅ STUDENT: GET /api/memberships/me
    if (method === "GET" && pathname === "/api/memberships/me") {
      const { studentId } = decoded;

      if (!studentId) {
        return res.status(404).json({ error: "Student ID not found in token" });
      }

      // ✅ Use lowercase model name
      const membership = await prisma.membership.findFirst({
        where: { studentId },
        include: { student: true }
      });

      if (!membership) {
        return res.status(404).json({ error: "Membership not found" });
      }

      return res.status(200).json(membership);
    }

    // ✅ ADMIN: GET /api/memberships/:studentId
    if (
      method === "GET" &&
      pathname.startsWith("/api/memberships/") &&
      pathname !== "/api/memberships"
    ) {
      if (decoded.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const parts = pathname.split("/");
      const maybeStudentId = parts[parts.length - 1];

      if (!isNaN(Number(maybeStudentId))) {
        const studentId = Number(maybeStudentId);

        const membership = await prisma.membership.findFirst({
          where: { studentId },
          include: { student: true }
        });

        if (!membership) {
          return res.status(404).json({ error: "Membership not found" });
        }

        return res.status(200).json(membership);
      }
    }

    // ✅ ADMIN: GET /api/memberships
    if (method === "GET" && pathname === "/api/memberships") {
      if (decoded.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const memberships = await prisma.membership.findMany({
        include: { student: true }
      });

      return res.status(200).json(memberships);
    }

    // ✅ ADMIN: POST /api/memberships/create
    if (method === "POST" && pathname === "/api/memberships/create") {
      if (decoded.role !== "ADMIN") {
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