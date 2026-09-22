import { apiClient } from '@/lib/api-client';
import { Student, CreateStudentDto, UpdateStudentDto } from '@/types';

export const studentsService = {
  /**
   * Create a new student application for the logged-in parent
   */
  async createStudent(data: CreateStudentDto): Promise<Student> {
    return apiClient.post<Student>('/students', data);
  },

  /**
   * Get all student applications belonging to the authenticated parent
   */
  async getMyStudents(): Promise<Student[]> {
    return apiClient.get<Student[]>('/students');
  },

  /**
   * Get student application by ID
   */
  async getStudentById(id: string): Promise<Student> {
    return apiClient.get<Student>(`/students/${id}`);
  },

  /**
   * Update student details (allowed only when applicationStatus is APPLICATION_CREATED and paymentStatus is UNPAID)
   */
  async updateStudent(id: string, data: UpdateStudentDto): Promise<Student> {
    return apiClient.patch<Student>(`/students/${id}`, data);
  },
};
