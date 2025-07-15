export const SMSCreditsModal = ({ isOpen, onClose, creditsData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white max-w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            SMS Credits Balance
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading credits...</p>
          </div>
        ) : creditsData ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-blue-900 font-semibold text-lg">
                  Current Balance
                </span>
                <span className="text-3xl font-bold text-blue-900">
                  ₱{creditsData.balance?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="text-sm text-blue-700 mt-2 flex items-center">
                <span className="mr-2">📱</span>~
                {Math.floor(
                  (creditsData.balance || 0) / (creditsData.costPerSMS || 0.35)
                )}{" "}
                SMS remaining
              </div>
              {creditsData.lastUpdated && (
                <div className="text-xs text-blue-600 mt-1">
                  Updated: {new Date(creditsData.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="text-sm text-gray-600 font-medium">
                  Used This Month
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₱{creditsData.used?.toFixed(2) || "0.00"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ~
                  {Math.floor(
                    (creditsData.used || 0) / (creditsData.costPerSMS || 0.35)
                  )}{" "}
                  SMS sent
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="text-sm text-gray-600 font-medium">
                  Cost per SMS
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ₱{creditsData.costPerSMS?.toFixed(2) || "0.35"}
                </div>
                <div className="text-xs text-green-600 mt-1 font-medium">
                  42% cheaper than Semaphore
                </div>
              </div>
            </div>

            {creditsData.lowBalance && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-3 text-xl">⚠️</span>
                  <div>
                    <span className="text-yellow-800 text-sm font-semibold">
                      Low Balance Warning!
                    </span>
                    <div className="text-yellow-700 text-xs mt-1">
                      Consider topping up your PhilSMS account to continue
                      sending reminders.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 border-t pt-4 space-y-1">
              <div className="flex justify-between">
                <span>Provider:</span>
                <span className="font-medium">
                  {creditsData.provider || "PhilSMS"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Currency:</span>
                <span className="font-medium">
                  {creditsData.currency || "PHP"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Networks:</span>
                <span className="font-medium">Globe, Smart, DITO, Sun</span>
              </div>
              {creditsData.note && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-blue-700 text-xs">
                  💡 {creditsData.note}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <p className="text-gray-700 font-medium mb-2">
              Failed to load credits information
            </p>
            <p className="text-sm text-gray-500">
              Please check your internet connection and try again
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-end border-t pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Line 123: SMS History Modal - Essential statistics and recent activity
export const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-4/5 max-w-6xl shadow-lg rounded-lg bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            SMS Reminder History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Loading SMS history...
            </p>
          </div>
        ) : historyData ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-900 font-semibold text-sm">Today</div>
                <div className="text-3xl font-bold text-blue-900 mt-1">
                  {historyData.todayCount || 0}
                </div>
                <div className="text-xs text-blue-700 mt-1">SMS sent today</div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="text-green-900 font-semibold text-sm">
                  Last 24h
                </div>
                <div className="text-3xl font-bold text-green-900 mt-1">
                  {historyData.last24HoursCount || 0}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Recent activity
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="text-purple-900 font-semibold text-sm">
                  Total Sent
                </div>
                <div className="text-3xl font-bold text-purple-900 mt-1">
                  {historyData.totalCount || 0}
                </div>
                <div className="text-xs text-purple-700 mt-1">All time</div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <div className="text-yellow-900 font-semibold text-sm">
                  Est. Cost
                </div>
                <div className="text-3xl font-bold text-yellow-900 mt-1">
                  ₱
                  {(
                    (historyData.totalCount || 0) *
                    (historyData.costPerSMS || 0.35)
                  ).toFixed(2)}
                </div>
                <div className="text-xs text-yellow-700 mt-1">Total spent</div>
              </div>
            </div>
            {historyData.statusDistribution &&
              Object.keys(historyData.statusDistribution).length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📊</span>
                    Delivery Status Distribution
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(historyData.statusDistribution).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="bg-white p-3 rounded border"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm capitalize">
                              {status.toLowerCase()}:
                            </span>
                            <span className="font-bold text-gray-900">
                              {count}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {(
                              (count / (historyData.totalCount || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            {/*  Recent reminders table */}
            {historyData.recentReminders &&
            historyData.recentReminders.length > 0 ? (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">📱</span>
                    Recent SMS Activity
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historyData.recentReminders
                        .slice(0, 10)
                        .map((reminder, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-medium">
                                {new Date(reminder.sentAt).toLocaleDateString()}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {new Date(reminder.sentAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {reminder.studentName || "N/A"}
                              </div>
                              {reminder.studentEmail && (
                                <div className="text-xs text-gray-500">
                                  {reminder.studentEmail}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div className="flex items-center">
                                <span className="mr-1">📱</span>
                                {reminder.phoneNumber || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  reminder.status === "SENT"
                                    ? "bg-green-100 text-green-800"
                                    : reminder.status === "FAILED"
                                    ? "bg-red-100 text-red-800"
                                    : reminder.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {reminder.status || "UNKNOWN"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              ₱{(reminder.cost || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination info */}
                {historyData.recentReminders.length > 10 && (
                  <div className="bg-gray-50 px-6 py-3 border-t text-sm text-gray-500">
                    Showing 10 most recent of{" "}
                    {historyData.recentReminders.length} total reminders
                  </div>
                )}
              </div>
            ) : (
              /* Line 272: Empty state for no reminders */
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-400 text-6xl mb-4">📱</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No SMS Reminders Sent Yet
                </h4>
                <p className="text-gray-500 max-w-md mx-auto">
                  Start sending payment reminders to overdue students. Your SMS
                  activity will appear here once you begin using the reminder
                  feature.
                </p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border text-xs text-gray-500 space-y-2">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <span className="font-medium">Provider:</span>
                  <span className="ml-1">
                    {historyData.provider || "PhilSMS"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Cost per SMS:</span>
                  <span className="ml-1">
                    ₱{(historyData.costPerSMS || 0.35).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Networks:</span>
                  <span className="ml-1">Globe, Smart, DITO, Sun</span>
                </div>
              </div>
              {historyData.message && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-blue-700">
                  💡 {historyData.message}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Line 306: Error state */
          <div className="text-center py-16">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Failed to Load SMS History
            </h4>
            <p className="text-gray-500 max-w-md mx-auto">
              Unable to retrieve SMS reminder history. Please check your
              connection and try again.
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-end border-t pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default {
  SMSCreditsModal,
  SMSHistoryModal,
};
