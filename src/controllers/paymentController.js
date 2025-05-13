const prisma = require('../config/db');
const AppError = require('../utils/AppError');

exports.getAllPayments = async (req, res, next) => {
try {
    const payments = await prisma.payment.findMany({ include: {membership: true}});
    res.json(payments);
} catch (error) {
    next(error);
}
}

exports.getMyPayments = async (req, res, next) => {
try {
    const userId = req.user.id;
    const payments = await prisma.payment.findMany({
        where: {membership: {userId}}
    });
    res.json(payments);
} catch (error) {
    next(error);
}
}

exports.addPayment = async (req, res, next) => {
    try {
        const {memberId} = req.params;
        const { amount } =req.body;

        const payment = await prisma.payment.create({
            data: {
                membershipId: parseInt(memberId),
                amount,
                paymentDate: new Date(),
            }
        });

        await prisma.membership.update({
            where: { id: parseInt(memberId)},
            data: { paymentStatus: 'PAID'},
        });

        res.status(201).json(payment);
    } catch (error) {
        next(error);
    }
}