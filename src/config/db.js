const { PrimaClient} = require('@prisma/client');
const prisma = new PrimaClient;
module.exports = prisma;