const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const {
  calculateDueDate,
  checkPaymentStatus,
} = require("../utils/membershipUtils");

exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { membership: true },
    });
    res.json(payments);
  } catch (error) {
    next(error);
  }
};

exports.getMyPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payments = await prisma.payment.findMany({
      where: { membership: { userId } },
    });
    res.json(payments);
  } catch (error) {
    next(error);
  }
};

exports.addPayment = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { amount } = req.body;

    const payment = await prisma.payment.create({
      data: {
        membershipId: parseInt(memberId),
        amount,
        paymentDate: new Date(),
      },
    });

    await prisma.membership.update({
      where: { id: parseInt(memberId) },
      data: { paymentStatus: "PAID" },
    });

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount } = req.body;

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: { membership: true },
    });

    if (!payment) {
      return next(new AppError("Payment not found", 404));
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(paymentId) },
      data: {
        amount,
        paymentDate: new Date(),
      },
    });

    const dueDate = calculateDueDate(
      payment.membership.startDate,
      payment.membership.type
    );
    const status = checkPaymentStatus(dueDate);

    const updatedMembership = await prisma.membership.update({
      where: { id: payment.membershipId },
      data: { paymentStatus: 'PAID' }, //  data: { paymentStatus: status },
    });

    res.json({ payment: updatedPayment, membership: updatedMembership });
  } catch (error) {
    next(error);
  }
};
