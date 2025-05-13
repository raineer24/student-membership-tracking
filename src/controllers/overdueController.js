const prisma = require("../config/db");
const {
  checkPaymentStatus,
  calculateDueDate,
} = require("../utils/membershipUtils");

exports.getOverdueStudents = async (req, res, next) => {
  try {
    const memberships = await prisma.membership.findMany({
      include: { user: true },
    });

    const overdueMemberships = memberships
        .map((membership) => {
            const dueDate = calculateDueDate(membership.startDate, membership.type);
            const status = checkPaymentStatus(dueDate);
            return {
                ...membership,
                dueDate,
                calculatedStatus: status,
            }
        })
        .filter((m) => m.calculatedStatus === 'OVERDUE');

        res.json(overdueMemberships);
  } catch (error) {
    next(error);
  }
};
