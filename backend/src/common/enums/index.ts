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

export enum ExamSlotStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

export enum RazorpayPaymentStatus {
  CREATED = 'CREATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
