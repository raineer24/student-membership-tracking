const express = require('express');
const router = express.Router();
const studentCtrl = require('../controllers/studentController');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

router.use(verifyToken);
router.use(isAdmin);

router.get('/', studentCtrl.getAllStudents);
router.get('/:id', studentCtrl.getStudentById);
router.post('/',studentCtrl.createStudent);
router.put('/:id', studentCtrl.updateStudent);
router.delete('/:id', studentCtrl.deleteStudent);

module.exports = router;