const prisma = require("../config/db");
const AppError = require("../utils/AppError");

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
        const { userId} = req.params;
        const { startDate, type} = req.body;

        const membership = await prisma.membership.create({
            data: {
                userId: parseInt(userId),
                startDate: new Date(startDate),
                type,
                paymentStatus: 'DUE'
            }
        });
        res.status(201).json(membership);
    } catch (error) {
        next(err);
    }
};
