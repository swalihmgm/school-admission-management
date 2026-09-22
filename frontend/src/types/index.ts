export enum UserRole {
  PARENT = 'PARENT',
  ADMIN = 'ADMIN',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum Grade {
  GRADE_1 = 'GRADE_1',
  GRADE_2 = 'GRADE_2',
  GRADE_3 = 'GRADE_3',
  GRADE_4 = 'GRADE_4',
}

export enum ApplicationStatus {
  APPLICATION_CREATED = 'APPLICATION_CREATED',
  REGISTRATION_FEE_PAID = 'REGISTRATION_FEE_PAID',
  SLOT_BOOKED = 'SLOT_BOOKED',
  EXAM_COMPLETED = 'EXAM_COMPLETED',
  ADMISSION_COMPLETED = 'ADMISSION_COMPLETED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

export enum ExamAttendance {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export interface ExamSlot {
  _id: string;
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface Student {
  _id: string;
  id?: string;
  parentId: string;
  studentName: string;
  dateOfBirth: string;
  gender: Gender;
  previousSchool: string;
  applyingGrade: Grade;
  applicationStatus: ApplicationStatus;
  paymentStatus: PaymentStatus;
  examSlotId?: string | ExamSlot | null;
  examAttendance?: ExamAttendance | null;
  examMarks?: number | null;
  examResultRecordedAt?: string | null;
  assignedGrade?: Grade | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentDto {
  studentName: string;
  dateOfBirth: string;
  gender: Gender;
  previousSchool: string;
  applyingGrade: Grade;
}

export interface UpdateStudentDto {
  studentName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  previousSchool?: string;
  applyingGrade?: Grade;
}

export interface UpdateExamResultDto {
  examAttendance: ExamAttendance;
  examMarks?: number | null;
}

export interface AssignCourseDto {
  assignedGrade: Grade;
}


export interface CreatePaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  studentId: string;
}

export interface VerifyPaymentDto {
  studentId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface VerifyPaymentResponse {
  statusCode: number;
  message: string;
  paymentStatus: PaymentStatus;
  applicationStatus: ApplicationStatus;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

export interface ParentUser {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt?: string;
  studentsCount?: number;
  students?: Partial<Student>[];
}

export interface CreateExamSlotDto {
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface UpdateExamSlotDto {
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status?: 'ACTIVE' | 'CANCELLED';
}



