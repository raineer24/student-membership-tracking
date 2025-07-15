const SMSHeaderControls = ({
  onCheckCredits,
  onViewHistory,
  loading = false,
}) => {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onCheckCredits}
        disabled={loading}
        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
        title="Check SMS credits balance"
      >
        💳 Credits
      </button>
      <button
        onClick={onViewHistory}
        disabled={loading}
        
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        title="View SMS reminder history"
      >
        📊 History
      </button>
    </div>
  );
};

export default SMSHeaderControls;
