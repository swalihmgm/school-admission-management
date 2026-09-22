import { apiClient } from '@/lib/api-client';
import {
  Student,
  ApplicationStatus,
  UpdateExamResultDto,
  AssignCourseDto,
} from '@/types';

export const admissionsService = {
  /**
   * Get all student applications (optionally filtered by status) for Admission Team / Admin
   */
  async getAdmissionsList(status?: ApplicationStatus): Promise<Student[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient.get<Student[]>(`/admissions${query}`);
  },

  /**
   * Record or edit entrance exam result for a student application
   */
  async updateExamResult(
    studentId: string,
    dto: UpdateExamResultDto
  ): Promise<Student> {
    return apiClient.patch<Student>(`/admissions/${studentId}/exam-result`, dto);
  },

  /**
   * Assign or update assigned grade/course for a student application
   */
  async assignCourse(
    studentId: string,
    dto: AssignCourseDto
  ): Promise<Student> {
    return apiClient.patch<Student>(`/admissions/${studentId}/course`, dto);
  },

  /**
   * Get all registered Parent user records for Admission Team / Admin
   */
  async getParentsList(): Promise<any[]> {
    return apiClient.get<any[]>('/admissions/parents');
  },
};
