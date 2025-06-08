const QuickActions = ({ onLogout }) => {
  const handleUpdateProfile = () => {
    // Navigate to profile page - replace with actual routing
    console.log("Navigate to profile update");
    // window.location.href = '/profile';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Actions:</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
            onClick={handleUpdateProfile}
            className="flex-p1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >Update Profile</button>

        <button
        onClick={onLogout}
        className="flex-p1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >Logout</button>
      </div>
    </div>
  );
};

export default QuickActions;
