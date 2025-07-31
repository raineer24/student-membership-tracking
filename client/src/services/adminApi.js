// client/src/services/adminApi.js
// Lines 1-150: Complete admin API service for admin-specific operations
import apiClient from "../utils/api";

class AdminApiService {
  // Line 5-15: Constructor - no interceptors needed (handled centrally)
  constructor() {
    // Auth interceptors handled centrally in utils/api.js
    // This service is specifically for admin operations
  }

  // Line 17-30: Get all students (admin dashboard)
  async getAllStudents() {
    try {
      const response = await apiClient.get("/students");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch all students:", error.message);
      
      if (error.response?.status === 403) {
        throw new Error("Admin privileges required to view all students");
      }
      
      throw new Error("Unable to load students list. Please try again.");
    }
  }

  // Line 32-50: Get specific student by ID (admin view)
  async getStudent(studentId) {
    try {
      const response = await apiClient.get(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch student ${studentId}:`, error.message);
      
      if (error.response?.status === 404) {
        throw new Error("Student not found");
      } else if (error.response?.status === 403) {
        throw new Error("Admin privileges required to view student details");
      }
      
      throw new Error("Unable to load student details. Please try again.");
    }
  }

  // Line 52-70: Create new student (admin only)
  async createStudent(studentData) {
    try {
      const response = await apiClient.post("/students", studentData);
      return response.data;
    } catch (error) {
      console.error("Failed to create student:", error.message);
      
      if (error.response?.status === 409) {
        throw new Error("Email already exists. Please use a different email.");
      } else if (error.response?.status === 400) {
        throw new Error("Invalid student data. Please check all required fields.");
      } else if (error.response?.status === 403) {
        throw new Error("Admin privileges required to create students");
      }
      
      throw new Error("Unable to create student. Please try again.");
    }
  }

  // Line 72-90: Update student (admin only)
  async updateStudent(studentId, updateData) {
    try {
      const response = await apiClient.put(`/students/${studentId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update student ${studentId}:`, error.message);
      
      if (error.response?.status === 404) {
        throw new Error("Student not found");
      } else if (error.response?.status === 403) {
        throw new Error("Admin privileges required to update students");
      } else if (error.response?.status === 409) {
        throw new Error("Email already exists. Please use a different email.");
      }
      
      throw new Error("Unable to update student. Please try again.");
    }
  }

  // Line 92-105: Delete student (admin only)
  async deleteStudent(studentId) {
    try {
      const response = await apiClient.delete(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete student ${studentId}:`, error.message);
      
      if (error.response?.status === 404) {
        throw new Error("Student not found");
      } else if (error.response?.status === 403) {
        throw new Error("Admin privileges required to delete students");
      }
      
      throw new Error("Unable to delete student. Please try again.");
    }
  }

  // Line 107-125: Get dashboard overview data
  async getDashboardData() {
    try {
      const response = await apiClient.get("/dashboard");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error.message);
      
      if (error.response?.status === 403) {
        throw new Error("Admin privileges required to view dashboard");
      }
      
      throw new Error("Unable to load dashboard data. Please try again.");
    }
  }

  // Line 127-145: Get all memberships (admin view)
  async getAllMemberships() {
    try {
      const response = await apiClient.get("/memberships");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch all memberships:", error.message);
      
      if (error.response?.status === 403) {
        throw new Error("Admin privileges required to view all memberships");
      }
      
      throw new Error("Unable to load memberships. Please try again.");
    }
  }

  // Line 147-165: Create membership for student
  async createMembership(membershipData) {
    try {
      const response = await apiClient.post("/memberships", membershipData);
      return response.data;
    } catch (error) {
      console.error("Failed to create membership:", error.message);
      
      if (error.response?.status === 400) {
        throw new Error("Invalid membership data. Please check all required fields.");
      } else if (error.response?.status === 403) {
        throw new Error("Admin privileges required to create memberships");
      } else if (error.response?.status === 409) {
        throw new Error("Student already has an active membership");
      }
      
      throw new Error("Unable to create membership. Please try again.");
    }
  }

  // Line 167-180: Get all payments (admin view)
  async getAllPayments() {
    try {
      const response = await apiClient.get("/payments");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch all payments:", error.message);
      
      if (error.response?.status === 403) {
        throw new Error("Admin privileges required to view all payments");
      }
      
      throw new Error("Unable to load payments. Please try again.");
    }
  }

  // Line 182-200: Record payment for student
  async createPayment(paymentData) {
    try {
      const response = await apiClient.post("/payments", paymentData);
      return response.data;
    } catch (error) {
      console.error("Failed to record payment:", error.message);
      
      if (error.response?.status === 400) {
        throw new Error("Invalid payment data. Please check all required fields.");
      } else if (error.response?.status === 403) {
        throw new Error("Admin privileges required to record payments");
      } else if (error.response?.status === 404) {
        throw new Error("Student not found");
      }
      
      throw new Error("Unable to record payment. Please try again.");
    }
  }

  // Line 202-220: Get overdue students
  async getOverdueStudents() {
    try {
      const response = await apiClient.get("/dashboard/overdue");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch overdue students:", error.message);
      
      if (error.response?.status === 403) {
        throw new Error("Admin privileges required to view overdue students");
      }
      
      throw new Error("Unable to load overdue students. Please try again.");
    }
  }

  // Line 222-240: Search students
  async searchStudents(query) {
    try {
      const response = await apiClient.get(`/students?search=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("Failed to search students:", error.message);
      
      if (error.response?.status === 403) {
        throw new Error("Admin privileges required to search students");
      }
      
      throw new Error("Unable to search students. Please try again.");
    }
  }

  // Line 242-260: Get student statistics
  async getStudentStats() {
    try {
      const response = await apiClient.get("/dashboard/stats");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch student statistics:", error.message);
      
      if (error.response?.status === 403) {
        throw new Error("Admin privileges required to view statistics");
      }
      
      throw new Error("Unable to load statistics. Please try again.");
    }
  }
}

// Export singleton instance
export const adminApi = new AdminApiService();