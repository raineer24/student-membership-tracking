const DashboardHeader = ({ student }) => {
  const studentName = student?.name || student;

  return (
    <div className="mb-8">
      <h1 className="text-3xl">Welcome back, {studentName} !</h1>
      <p className="text-gray-600">
        Manage your membership and view your account details.
      </p>
    </div>
  );
};

export default DashboardHeader;
