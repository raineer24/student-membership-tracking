import { useState, useCallback } from "react";
import { useToast } from "./useToast";

export const useSMSReminders = (token) => {
  const [smsLoading, setSmsLoading] = useState(false);
  const [lastReminderTime, setLastReminderTime] = useState({});
  const { showSuccess, showError } = useToast();

  const canSendReminder = useCallback(
    (student) => {
      if (
        !student?.phone ||
        (student.status !== "OVERDUE" && student.status !== "EXPIRED")
      ) {
        return false;
      }

      const lastReminder = lastReminderTime[student.id];
      const now = Date.now();
      const cooldownMs = 24 * 60 * 60 * 1000;
      return !lastReminder || now - lastReminder >= cooldownMs;
    },
    [lastReminderTime]
  );

  const sendReminder = useCallback(
    async (student) => {
      if (!student?.phone) {
        showError("Student has no phone number on file");
        return false;
      }

      if (!canSendReminder(student)) {
        const lastReminder = lastReminderTime[student.id];
        const now = Date.now();
        const hoursLeft = Math.ceil(
          (24 * 60 * 60 * 1000 - (now - lastReminder)) / (60 * 60 * 1000)
        );
        showError(
          `Please wait ${hoursLeft} more hours before sending another reminder`
        );
        return false;
      }

      setSmsLoading(true);

      try {
        const response = await fetch("/api/reminders/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: student.id,
            message: `Hi ${student.firstName}! Your payment is overdue. Please settle your account. Thank you!`,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to send reminder");
        }

        // Line 48: Update rate limiting state
        setLastReminderTime((prev) => ({
          ...prev,
          [student.id]: Date.now(),
        }));

        showSuccess(
          `✅ SMS sent to ${student.firstName} - Cost: ₱${result.data.cost}`
        );
        return true;
      } catch (error) {
        showError(`Failed to send reminder: ${error.message}`);
        return false;
      } finally {
        setSmsLoading(false);
      }
    },
    [token, lastReminderTime, showSuccess, showError, canSendReminder]
  );

  return {
    smsLoading,
    canSendReminder,
    sendReminder,
    lastReminderTime
  };
};
