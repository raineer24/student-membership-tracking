const prisma = require("../config/db");
const AppError = require("../utils/AppError");

exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ensure ID is parsed as integer
    const studentId = parseInt(id);

    // Get logged-in user from JWT
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    //If requester is not Admin and is not viewing self → deny
    if (requesterRole !== 'ADMIN' && requesterId !== studentId) {
      return next(new AppError('You do not have permission to view this profile', 403))
    }

    const student = await prisma.user.findUnique({
      where: { id: parseInt(id), role: "STUDENT" },
      include: { memberships: true },
    });
    if (!student) return next(new AppError("Student not found", 404));
    res.json(student);
  } catch (error) {
    next(err);
  }
};

exports.createStudent = async (req, res, next) => {
    try {
        const { name, email, password} = req.body;
        const user = await prisma.user.create({
            data: { name, email, password, role: 'STUDENT'}
        });
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

exports.updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const updated = await prisma.user.update({
      where: { id: parseInt(id), role: "STUDENT" },
      data: { name, email, password },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id), role: "STUDENT" } });
    res.json({ message: "Student deleted" });
  } catch (error) {
    next(error);
  }
};
