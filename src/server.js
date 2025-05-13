require('dotenv').config({
  path: process.env.NODE_ENV === 'production'
    ? './.env.production'
    : './.env.development'
});

const app = require('./app');
const PORT = process.env.PORT || 5000;
//const updateMembershipStatuses = require('./cron/updateMembershipStatuses');
//const cron = require('node-cron');

// Daily cron job at midnight
// cron.schedule('0 0 * * *', () => {
//   console.log('Running daily membership status update...');
//   updateMembershipStatuses();
// });

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});