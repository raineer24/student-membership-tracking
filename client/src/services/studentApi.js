// client/src/services/studentApi.js - CLEANED VERSION
// Lines 1-100: StudentApiService with NO duplicate interceptors
import apiClient from "../utils/api";

class StudentApiService {
  // Line 5-10: Constructor - NO interceptors (handled in utils/api.js)
  constructor() {
    // ✅ Interceptors are now handled centrally in utils/api.js
    // ❌ REMOVED all duplicate interceptor code from here
    console.log("📋 StudentApiService initialized - using enhanced interceptors");
  }

  // Line 12-25: Get student profile with enhanced error handling
  async getStudentProfile() {
    try {
      console.log("🔍 Fetching student profile...");
      const response = await apiClient.get("/students/me");
      console.log("✅ Student profile fetched successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch student profile:", error.message);
      
      // Enhanced interceptor will handle 401/403 automatically
      // Just provide user-friendly error messages
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
      console.log("🔍 Fetching current membership...");
      const response = await apiClient.get("/memberships/me");
      console.log("✅ Membership fetched successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch membership:", error.message);
      
      // 404 is expected when student has no membership
      if (error.response?.status === 404) {
        console.log("ℹ️ No membership found for student");
        return null;
      }
      
      // Enhanced interceptor handles 401/403 automatically
      if (error.response?.status === 403) {
        throw new Error("Access denied to membership data");
      }
      
      throw new Error("Unable to load membership data. Please try again.");
    }
  }

  // Line 47-60: Get payment history with fallback to empty array
  async getPaymentHistory() {
    try {
      console.log("🔍 Fetching payment history...");
      // Currently using student profile data since no dedicated endpoint exists
      const studentProfile = await this.getStudentProfile();
      console.log("✅ Payment history retrieved from profile");
      return studentProfile.payments || [];
    } catch (error) {
      console.error("❌ Failed to fetch payment history:", error.message);
      
      // Return empty array for graceful degradation
      // UI can show "No payment history available" message
      return [];
    }
  }

  // Line 62-85: Get complete dashboard data with atomic operations
  async getDashboardData() {
    try {
      console.log("🔍 Fetching complete dashboard data...");
      
      // Fetch student profile first (required data)
      const student = await this.getStudentProfile();
      console.log("✅ Student data loaded");

      // Fetch membership separately (optional data)
      const membership = await this.getCurrentMembership();
      console.log("✅ Membership data loaded");

      // Extract payments from student data
      const payments = student.payments || [];
      console.log(`✅ Found ${payments.length} payments`);

      const dashboardData = {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
        membership,
        payments,
      };
      
      console.log("✅ Dashboard data assembled successfully");
      return dashboardData;
      
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data:", error.message);
      
      // Enhanced interceptor handles auth errors automatically
      // Just provide user-friendly message
      throw new Error("Unable to load dashboard data. Please refresh the page or try again.");
    }
  }

  // Line 87-100: Update student profile
  async updateProfile(profileData) {
    try {
      console.log("🔄 Updating student profile...", profileData);
      
      const student = await this.getStudentProfile();
      const response = await apiClient.put(`/students/${student.id}`, profileData);
      
      console.log("✅ Profile updated successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Failed to update profile:", error.message);
      
      // Enhanced interceptor handles auth errors automatically
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