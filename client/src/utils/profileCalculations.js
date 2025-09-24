// File: client/src/utils/profileCalculations.js
// Lines 1-45: Pure calculation functions extracted from StudentProfileView

export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Invalid Date";
  }
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "₱0";
  return `₱${parseFloat(amount).toLocaleString()}`;
};

export const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.sessions)) return data.sessions;
  return [];
};