import prisma from "../../utils/db";
import { authenticate } from "../../utils/auth";

export default async function handler(req, res) {
  console.log("PAYMENTS HANDLER HIT");
  const { method } = req;

  // Parse full URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log("RAW URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("METHOD:", method);

  try {
    const user = await authenticate(req);
    console.log("USER ROLE:", user?.role);

    // ✅ STUDENT: GET /api/payments/me
    if (method === "GET" && pathname === "/api/payments/me") {
      const payments = await prisma.payment.findMany({
        where: { student: { userId: user.id } },
        include: { student: true },
      });

      return res.status(200).json(payments);
    }

    // ✅ ADMIN: GET /api/payments
    if (method === "GET" && pathname === "/api/payments") {
      if (user.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const payments = await prisma.payment.findMany({
        include: { student: true },
      });

      return res.status(200).json(payments);
    }

    // ✅ ADMIN: GET /api/payments/:id
    if (method === "GET" && pathname.startsWith("/api/payments/")) {
      const parts = pathname.split("/");
      const maybeId = parts[parts.length - 1];

      if (!isNaN(Number(maybeId))) {
        const paymentId = Number(maybeId);

        if (user.role !== "ADMIN") {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { student: true },
        });

        if (!payment) {
          return res.status(404).json({ error: "Payment not found" });
        }

        return res.status(200).json(payment);
      }
    }

    // ✅ ADMIN: POST /api/payments/create
    if (method === "POST" && pathname === "/api/payments/create") {
      if (user.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { studentId, amount } = req.body;

      const newPayment = await prisma.payment.create({
        data: {
          studentId,
          amount,
          paidAt: new Date(),
        },
      });

      return res.status(201).json(newPayment);
    }

    // ✅ ADMIN: PUT /api/payments/:id
    if (method === "PUT" && pathname.startsWith("/api/payments/")) {
      const parts = pathname.split("/");
      const maybeId = parts[parts.length - 1];

      if (!isNaN(Number(maybeId))) {
        const paymentId = Number(maybeId);

        if (user.role !== "ADMIN") {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const { amount } = req.body;

        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: { amount },
        });

        return res.status(200).json(updatedPayment);
      }
    }

    // ✅ ADMIN: DELETE /api/payments/:id
    if (method === "DELETE" && pathname.startsWith("/api/payments/")) {
      const parts = pathname.split("/");
      const maybeId = parts[parts.length - 1];

      if (!isNaN(Number(maybeId))) {
        const paymentId = Number(maybeId);

        if (user.role !== "ADMIN") {
          return res.status(403).json({ error: "Unauthorized" });
        }

        await prisma.payment.delete({
          where: { id: paymentId },
        });

        return res.status(204).end();
      }
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