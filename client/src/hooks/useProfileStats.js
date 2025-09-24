// File: client/src/hooks/useProfileStats.js
// Lines 1-60: Statistics calculation hook extracted from StudentProfileView

import { useMemo } from 'react';
import { calculateMembershipStatus } from '../utils/profileStats';

export const useProfileStats = (studentData, trainingHistory) => {
  const membershipStatus = useMemo(() => {
    return calculateMembershipStatus(studentData?.memberships);
  }, [studentData]);

  const trainingStats = useMemo(() => {
    const sessions = Array.isArray(trainingHistory) ? trainingHistory : [];
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        lastTrainingDate: null,
        lastTrainingText: "Never",
        attendanceRate: 0,
        daysSinceLastTraining: null,
        isInactive: false
      };
    }

    const totalSessions = sessions.length;
    const presentSessions = sessions.filter(t => t && t.attendanceStatus === 'PRESENT').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    const sortedSessions = [...sessions].sort((a, b) => {
      if (!a?.sessionDate || !b?.sessionDate) return 0;
      return new Date(b.sessionDate) - new Date(a.sessionDate);
    });
    
    const lastSession = sortedSessions[0];
    const lastTrainingDate = lastSession ? new Date(lastSession.sessionDate) : null;
    
    let daysSinceLastTraining = null;
    let isInactive = false;
    
    if (lastTrainingDate && !isNaN(lastTrainingDate.getTime())) {
      const today = new Date();
      const diffTime = today.getTime() - lastTrainingDate.getTime();
      daysSinceLastTraining = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      isInactive = daysSinceLastTraining >= 30;
    }

    return {
      totalSessions,
      lastTrainingDate,
      lastTrainingText: lastTrainingDate ? lastTrainingDate.toLocaleDateString() : "Never",
      attendanceRate,
      daysSinceLastTraining,
      isInactive
    };
  }, [trainingHistory]);

  return { membershipStatus, trainingStats };
};