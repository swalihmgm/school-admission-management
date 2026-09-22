import React from 'react';
import { ApplicationStatus, PaymentStatus } from '@/types';
import {
  DocumentTextIcon,
  CreditCardIcon,
  CalendarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  let label = status as string;
  let bgClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  let IconComponent = DocumentTextIcon;

  switch (status) {
    case ApplicationStatus.APPLICATION_CREATED:
      label = 'Application Created';
      bgClass = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      IconComponent = DocumentTextIcon;
      break;
    case ApplicationStatus.REGISTRATION_FEE_PAID:
      label = 'Registration Fee Paid';
      bgClass = 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      IconComponent = CreditCardIcon;
      break;
    case ApplicationStatus.SLOT_BOOKED:
      label = 'Exam Slot Booked';
      bgClass = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      IconComponent = CalendarIcon;
      break;
    case ApplicationStatus.EXAM_COMPLETED:
      label = 'Exam Completed';
      bgClass = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      IconComponent = AcademicCapIcon;
      break;
    case ApplicationStatus.ADMISSION_COMPLETED:
      label = 'Admission Completed';
      bgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      IconComponent = CheckCircleIcon;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const isPaid = status === PaymentStatus.PAID;
  const label = isPaid ? 'Paid' : 'Unpaid';
  const bgClass = isPaid
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  const IconComponent = isPaid ? CheckCircleIcon : XCircleIcon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
