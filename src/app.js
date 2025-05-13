const express = require('express');
const cors = require('cors');
const prisma = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const {handleErrors} = require('./middleware/error');

const app = express();

//connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);


app.use(handleErrors);

module.exports = app;