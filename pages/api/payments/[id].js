const prisma = require("../../../utils/db");
const { authenticate } = require("../../../utils/auth");

module.exports.default = async function handler(req, res) {
  const { id } = req.query;
  console.log("id", req.query);
  try {
    const decoded = authenticate(req);
    if (decoded.role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden: Admin only" });

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid or missing payment ID" });
    }

    if (req.method === "PUT") {
      let data;

      // Safely parse body
      try {
        data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON format" });
      }
      const { amount, studentId } = data;
      console.log('studentid',typeof studentId)
       if (!amount && !studentId){ return res.status(400).json({ error: 'No fields to update' });
     }

     const updates = {};

      if (amount !== undefined) {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
          return res.status(400).json({ error: 'Invalid amount' });
        }
        updates.amount = parsedAmount;
      }

            if (studentId !== undefined) {
        const parsedStudentId = parseInt(studentId);
        if (isNaN(parsedStudentId)) {
          return res.status(400).json({ error: 'Invalid student ID' });
        }

        const student = await prisma.student.findUnique({
          where: { id: parsedStudentId },
        });

        if (!student) {
          return res.status(404).json({ error: 'Student not found' });
        }

        updates.studentId = parsedStudentId;
      }


     const updatedPayment = await prisma.payment.update({
        where: { id: parseInt(id) },
        data: updates,
      });

      return res.json(updatedPayment);

      return res.json(updatedPayment);
    }

    if (req.method === "DELETE") {
      await prisma.payment.delete({ where: { id: parseInt(id) } });
      return res.status(204).json();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
