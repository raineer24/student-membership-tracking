require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Utility function to wrap Vercel-style handlers
function wrap(handler) {
  return async (req, res) => {
    const mockReq = {
      ...req,
       query: { ...req.query, ...req.params },
      body: req.body,
      method: req.method,
      headers: req.headers,
    };

    try {
      await handler(mockReq, res);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Express app setup
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Auth Routes
app.post('/api/auth/login', wrap(require('./pages/api/auth').default));
app.post('/api/auth/register', wrap(require('./pages/api/auth').default));

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Local API running at: http://localhost:${PORT}`);
});
