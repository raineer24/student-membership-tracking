require('dotenv').config({
  path: process.env.NODE_ENV === 'production'
    ? './.env.production'
    : './.env.development'
});

const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});