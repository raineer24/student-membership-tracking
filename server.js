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
      query: req.query,
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

// AUTH
app.post('/api/auth/register', wrap(require('./pages/api/auth/register').default));
app.post('/api/auth/login', wrap(require('./pages/api/auth/login').default));

// STUDENTS
app.get('/api/students', wrap(require('./pages/api/students/index').default));
app.post('/api/students', wrap(require('./pages/api/students/index').default));
app.get('/api/students/:id', wrap(require('./pages/api/students/[id]').default));
app.put('/api/students/:id', wrap(require('./pages/api/students/[id]').default));
app.delete('/api/students/:id', wrap(require('./pages/api/students/[id]').default));

// MEMBERSHIPS
app.get('/api/memberships', wrap(require('./pages/api/memberships/index').default));
app.get('/api/memberships/me', wrap(require('./pages/api/memberships/me').default));
app.post('/api/memberships/create', wrap(require('./pages/api/memberships/create').default));

// PAYMENTS
app.get('/api/payments', wrap(require('./pages/api/payments/index').default));
app.get('/api/payments/me', wrap(require('./pages/api/payments/me').default));
app.put('/api/payments/:id', wrap(require('./pages/api/payments/[id]').default));

// DASHBOARD
app.get('/api/dashboard', wrap(require('./pages/api/dashboard/index').default));

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Local API running at: http://localhost:${PORT}`);
});
