const prisma = require('../config/db');
const AppError = require('../utils/AppError');

exports.getAllMemberships = async (req, res, next) => {
    const memberships = await prisma.membership.findMany({ include: { user: true}});
}