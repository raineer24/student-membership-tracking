import prisma from "../../utils/db";
import { authenticate, authorizeRole } from "../../utils/auth";

export default async function handler(req, res) {
  const { method, query } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Extract path parts after "/api/payments"
  const parts = pathname.split("/").filter(Boolean);
  const paymentsIndex = parts.indexOf("payments");
  const pathParts = paymentsIndex !== -1 ? parts.slice(paymentsIndex + 1) : [];

  console.log("🔥 payments API hit");
  console.log("REQ.URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("PATH PARTS:", pathParts);

  try {
    const user = await authenticate(req);

    // ✅ GET /api/payments – List all payments
    if (method === "GET" && pathParts.length === 0) {
      await authorizeRole("ADMIN", user);

      const payments = await prisma.payment.findMany({
        include: { student: true },
      });

      return res.status(200).json(payments);
    }

    // ✅ GET /api/payments/:id
    if (
      method === "GET" &&
      pathParts.length === 1 &&
      !isNaN(Number(pathParts[0]))
    ) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { student: true },
      });

      return payment
        ? res.status(200).json(payment)
        : res.status(404).json({ error: "Payment not found" });
    }

    // ✅ POST /api/payments/create
    if (
      method === "POST" &&
      pathParts.length === 1 &&
      pathParts[0] === "create"
    ) {
      await authorizeRole("ADMIN", user);

      const {
        studentId,
        amount,
        method = "CASH",
        description,
        extendMembership = true,
        membershipType = "MONTHLY",
      } = req.body;

      //Validate required fields
      if (!studentId || !amount) {
        return res.status(400).json({
          error: "Student ID and amount are required",
        });
      }

      // Validate student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { memberships: true },
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      const newPayment = await prisma.payment.create({
        data: {
          studentId,
          amount: parseFloat(amount),
          description,
          status: "COMPLETED",
          paidAt: new Date(),
        },
        include: {
          student: true
        }
      });

      //Auto-extend membership if requested
      if (extendMembership) {
        let membership = await prisma.membership.findFirst({
          where: { studentId},
          orderBy: { endDate: 'desc'}
        });

        if (!membership) {
          //Create new membership if none exists
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + (membershipType === 'YEARLY' ? 365 : 30));

           membership = await prisma.membership.create({
        data: {
          studentId,
          startDate,
          endDate,
          type: membershipType,
          isActive: true
        },
       
      });

        

         
        } else {
          // Extend existing membership
            const baseDate =
            new Date(membership.endDate) < new Date()
              ? new Date()
              : new Date(membership.endDate);
          const newEndDate = new Date(baseDate);
          newEndDate.setDate(newEndDate.getDate() + (membershipType === 'YEARLY' ? 365 : 30));

           membership =await prisma.membership.update({
            where: { id: membership.id },
            data: { 
              endDate: newEndDate,
              type:membershipType,
              isActive: true
             },
          });
        }
      }

      return res.status(201).json({
        payment: newPayment,
        message: extendMembership ? 'Payment processed and membership extended' : 'Payment Processed'
      });
    }

    // ✅ PUT /api/payments/:id
    if (
      method === "PUT" &&
      pathParts.length === 1 &&
      !isNaN(Number(pathParts[0]))
    ) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);
      const { amount } = req.body;

      const updated = await prisma.payment.update({
        where: { id },
        data: { amount },
      });

      return res.status(200).json(updated);
    }

    // ✅ DELETE /api/payments/:id
    if (
      method === "DELETE" &&
      pathParts.length === 1 &&
      !isNaN(Number(pathParts[0]))
    ) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);
      await prisma.payment.delete({ where: { id } });
      return res.status(204).end();
    }

    // 🚫 Unsupported route
    return res.status(404).json({ error: "Route not found" });
  } catch (err) {
    console.error("❌ ERROR:", err);
    if (err.message === "Authentication required") {
      return res.status(401).json({ error: err.message });
    }
    if (err.message === "Unauthorized") {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
