const express = require('express');
const cors = require('cors');
const prisma = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
//const overdueRoutes = require('./routes/overdue');
const {handleErrors} = require('./middleware/error');

const app = express();

//connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentRoutes);
//app.use('/api/overdueRoutes');

app.use(handleErrors);

module.exports = app;