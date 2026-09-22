import { apiClient } from '@/lib/api-client';
import { CreatePaymentOrderResponse, VerifyPaymentDto, VerifyPaymentResponse } from '@/types';

export const paymentsService = {
  /**
   * Create a Razorpay payment order for student application registration fee
   */
  async createOrder(studentId: string): Promise<CreatePaymentOrderResponse> {
    return apiClient.post<CreatePaymentOrderResponse>('/payments/order', { studentId });
  },

  /**
   * Verify Razorpay payment signature on backend
   */
  async verifyPayment(dto: VerifyPaymentDto): Promise<VerifyPaymentResponse> {
    return apiClient.post<VerifyPaymentResponse>('/payments/verify', dto);
  },
};
