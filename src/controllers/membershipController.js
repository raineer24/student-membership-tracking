const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const { calculateDueDate } = require("../utils/membershipUtils");

exports.getAllMemberships = async (req, res, next) => {
  try {
    const memberships = await prisma.membership.findMany({
      include: { user: true },
    });
    res.json(memberships);
  } catch (error) {
    next(error);
  }
};

exports.getMyMembership = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { payments: true },
    });
    if (!membership) return next(new AppError("No membership found", 404));
    res.json(membership);
  } catch (error) {
    next(error);
  }
};

exports.createMembership = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { startDate, type } = req.body;

    const dueDate = calculateDueDate(new Date(startDate), type);

    const membership = await prisma.membership.create({
      data: {
        userId: parseInt(userId),
        startDate: new Date(startDate),
        type,
        paymentStatus: "DUE",
        endDate: dueDate,
      },
    });
    res.status(201).json(membership);
  } catch (error) {
    next(error);
  }
};

// GET /api/memberships/:userId (Admin only)
exports.getMembershipByStudentId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const membership = await prisma.membership.findFirst({
      where: { userId: parseInt(userId) },
      include: {
        payments: true,
        user: true,
        user: true,
      },
    });

    if (!membership) {
      return next(new AppError("No membership found for this student", 404));
    }

    res.json(membership);
  } catch (error) {
    next(error);
  }
};
