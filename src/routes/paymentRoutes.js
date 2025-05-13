const express = require("express");
const router = express.Router();
const paymentCtrl = require("../controllers/paymentController");
const { verifyToken, isAdmin } = require("../middleware/authJwt");

router.use(verifyToken);
router.get("/me", paymentCtrl.getMyPayments);
router.get("/", isAdmin, paymentCtrl.getAllPayments);
router.post("/:memberId", isAdmin, paymentCtrl.addPayment);
router.put('/:paymentId', isAdmin, paymentCtrl.updatePayment);

module.exports = router;
