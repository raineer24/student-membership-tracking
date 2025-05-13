const express = require('express');
const router = express.Router();
const membershipCtrl = require('../controllers/membershipController');
const { verifyToken, isAdmin} = require('../middleware/authJwt');

router.use(verifyToken);
router.get('/me', membershipCtrl.getMyMembership);
router.get('/', isAdmin, membershipCtrl.getAllMemberships);
router.post('/:userId', isAdmin, membershipCtrl.createMembership);
router.get('/:userId', isAdmin, membershipCtrl.getMembershipByStudentId);

module.exports = router;