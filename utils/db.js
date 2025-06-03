// utils/db.js
const { PrismaClient } = require('@prisma/client');

// Use singleton pattern to avoid multiple instances
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance
  // across module reloads caused by HMR (Hot Module Replacement)
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// Test connection function
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

module.exports = prisma;

// Export named export as well for compatibility
module.exports.prisma = prisma;
module.exports.testConnection = testConnection;