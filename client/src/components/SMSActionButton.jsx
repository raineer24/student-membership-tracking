const SMSActionButton = ({
  student,
  canSendReminder,
  onSendReminder,
  loading = false,
}) => {
  const isOverdue =
    student.status === "OVERDUE" || student.status === "EXPIRED";
  const showButton = canSendReminder(student);

  if (!isOverdue) return null;

  if (!student.phone) {
    return (
      <span className="text-red-500 text-xs" title="No phone number on file">
        📱 ❌
      </span>
    );
  }

   if (!showButton) {
    return (
      <span className="text-gray-500 text-xs" title="Reminder sent recently - 24hr cooldown">
        📱 ⏳
      </span>
    );
  }

   return (
    <button
      onClick={() => onSendReminder(student)}
      disabled={loading}
      className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors disabled:opacity-50"
      title={`Send payment reminder to ${student.firstName}`}
    >
      📱 Remind
    </button>
  );
};

export default SMSActionButton;
