import apiClient from "../utils/api";

class StudentApiService {
  constructor() {
    // Set Up axios interceptor for authentication
    apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Set up axios interceptor for handling auth errors
    apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  async getStudentProfile() {
    try {
      const response = await apiClient("/students/me");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch student profile", error);

      throw new Error("Unable to load student profile");
    }
  }

  async getCurrentMembership() {
    try {
      const response = await apiClient("/memberships/me");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch membership", error);
      // Return null for no membership instead of throwing error
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error("Unable to load membership data");
    }
  }

  async getPaymentHistory() {
    try {
      //Since there's no student specific payment endpoint yet,
      //we'll need to add this endpoint or use the student profile data
      const studentProfile = await this.getStudentProfile();
      return studentProfile.payments || [];
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      return []; // Return empty array instead of throwing
    }
  }

  async getDashboardData() {
    try {
      //Fetch student profile first (includes payments)
      const student = await this.getStudentProfile();

      // Fetch membership separately
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
      console.error("Failed to fetch dashboard data", error);
      throw new Error("Unable to load dashboard data. Please try again");
    }
  }

  async updateProfile(profileData) {
    try {
      const student = await this.getStudentProfile();
      const response = await apiClient.put(`/students/${student.id}`, profileData);
      return response.data;
    } catch (error) {
      console.error("Failed to update profile", error);
      throw new Error("Unable to update profile");
    }
  }
}

export const studentApi = new StudentApiService();
