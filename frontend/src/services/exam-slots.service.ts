import { apiClient } from '@/lib/api-client';
import { ExamSlot, Student } from '@/types';

export interface BookExamSlotResponse {
  statusCode: number;
  message: string;
  student: Student;
  slot: ExamSlot;
}

export const examSlotsService = {
  /**
   * Get available active exam slots for parent (where bookedCount < capacity)
   */
  async getAvailableSlots(): Promise<ExamSlot[]> {
    return apiClient.get<ExamSlot[]>('/exam-slots');
  },

  /**
   * Book or reschedule an exam slot for a student application
   */
  async bookOrRescheduleSlot(
    studentId: string,
    slotId: string
  ): Promise<BookExamSlotResponse> {
    return apiClient.post<BookExamSlotResponse>(`/students/${studentId}/exam-slot`, {
      slotId,
    });
  },

  /**
   * Get all exam slots (including cancelled slots) for Admin management
   */
  async getAllSlotsForAdmin(): Promise<ExamSlot[]> {
    return apiClient.get<ExamSlot[]>('/exam-slots/admin');
  },

  /**
   * Create a new exam slot (Admin only)
   */
  async createSlot(dto: {
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
  }): Promise<ExamSlot> {
    return apiClient.post<ExamSlot>('/exam-slots', dto);
  },

  /**
   * Update or cancel an existing exam slot (Admin only)
   */
  async updateSlot(
    slotId: string,
    dto: {
      date?: string;
      startTime?: string;
      endTime?: string;
      capacity?: number;
      status?: 'ACTIVE' | 'CANCELLED';
    }
  ): Promise<ExamSlot> {
    return apiClient.patch<ExamSlot>(`/exam-slots/${slotId}`, dto);
  },
};
