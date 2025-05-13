const express = require('express');
const router = express.Router();
const overdueCtrl = require('../controllers/overdueController');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

router.use(verifyToken);
router.use(isAdmin);
router.get('/',overdueCtrl.getOverdueStudents);

module.exports = router;