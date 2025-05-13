const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/paymentController');
const { verifyToken, isAdmin } = require('../middleware/authJwt');