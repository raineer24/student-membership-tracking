// client/src/services/studentApi.js
// Lines 1-80: Simplified StudentApiService without duplicate interceptors
import apiClient from "../utils/api";

class StudentApiService {
  // Line 5-10: Constructor - no interceptors needed (handled centrally)
  constructor() {
    // Interceptors are now handled centrally in utils/api.js
    // This follows DRY principle and eliminates duplicate code
  }

  // Line 12-25: Get student profile with enhanced error handling
  async getStudentProfile() {
    try {
      const response = await apiClient.get("/students/me");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch student profile:", error.message);
      
      // Provide specific error messages based on status
      if (error.response?.status === 404) {
        throw new Error("Student profile not found");
      } else if (error.response?.status === 403) {
        throw new Error("Access denied to student profile");
      }
      
      throw new Error("Unable to load student profile. Please try again.");
    }
  }

  // Line 27-45: Get current membership with null return for missing data
  async getCurrentMembership() {
    try {
      const response = await apiClient.get("/memberships/me");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch membership:", error.message);
      
      // 404 is expected when student has no membership
      if (error.response?.status === 404) {
        return null;
      }
      
      // Other errors should be thrown
      if (error.response?.status === 403) {
        throw new Error("Access denied to membership data");
      }
      
      throw new Error("Unable to load membership data. Please try again.");
    }
  }

  // Line 47-60: Get payment history with fallback to empty array
  async getPaymentHistory() {
    try {
      // Currently using student profile data since no dedicated endpoint exists
      const studentProfile = await this.getStudentProfile();
      return studentProfile.payments || [];
    } catch (error) {
      console.error("Failed to fetch payment history:", error.message);
      
      // Return empty array for graceful degradation
      // UI can show "No payment history available" message
      return [];
    }
  }

  // Line 62-80: Get complete dashboard data with atomic operations
  async getDashboardData() {
    try {
      // Fetch student profile first (required data)
      const student = await this.getStudentProfile();

      // Fetch membership separately (optional data)
      const membership = await this.getCurrentMembership();

      // Extract payments from student data
      const payments = student.payments || [];

      return {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
        membership,
        payments,
      };
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error.message);
      
      // Re-throw with user-friendly message
      throw new Error("Unable to load dashboard data. Please refresh the page or try again.");
    }
  }

  // Line 82-95: Update student profile
  async updateProfile(profileData) {
    try {
      const student = await this.getStudentProfile();
      const response = await apiClient.put(`/students/${student.id}`, profileData);
      return response.data;
    } catch (error) {
      console.error("Failed to update profile:", error.message);
      
      if (error.response?.status === 403) {
        throw new Error("You don't have permission to update this profile");
      } else if (error.response?.status === 422) {
        throw new Error("Invalid profile data provided");
      }
      
      throw new Error("Unable to update profile. Please try again.");
    }
  }
}

// Export singleton instance
export const studentApi = new StudentApiService();