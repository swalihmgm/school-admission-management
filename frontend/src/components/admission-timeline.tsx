'use client';

import React from 'react';
import {
  Student,
  ApplicationStatus,
  PaymentStatus,
  ExamAttendance,
  ExamSlot,
} from '@/types';
import {
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  CalendarIcon,
  CreditCardIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface AdmissionTimelineProps {
  student: Student;
  bookedSlot?: ExamSlot | null;
}

export const ADMISSION_STAGES = [
  {
    key: ApplicationStatus.APPLICATION_CREATED,
    step: 1,
    title: 'Application Created',
    subtitle: 'Submitted',
  },
  {
    key: ApplicationStatus.REGISTRATION_FEE_PAID,
    step: 2,
    title: 'Registration Fee Paid',
    subtitle: 'Fee Verified',
  },
  {
    key: ApplicationStatus.SLOT_BOOKED,
    step: 3,
    title: 'Exam Slot Booked',
    subtitle: 'Assessment Scheduled',
  },
  {
    key: ApplicationStatus.EXAM_COMPLETED,
    step: 4,
    title: 'Exam Completed',
    subtitle: 'Attendance & Marks',
  },
  {
    key: ApplicationStatus.ADMISSION_COMPLETED,
    step: 5,
    title: 'Admission Completed',
    subtitle: 'Grade Finalized',
  },
];

function getActiveStepNumber(student: Student): number {
  if (student.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED) {
    return 6; // All 5 steps completed!
  }

  const hasExamRecorded =
    student.applicationStatus === ApplicationStatus.EXAM_COMPLETED ||
    (student.examMarks !== null && student.examMarks !== undefined) ||
    student.examAttendance === ExamAttendance.ABSENT ||
    student.examAttendance === ExamAttendance.PRESENT;

  if (hasExamRecorded) {
    return 5; // Step 4 ("Exam Completed") is COMPLETED (Green), Step 5 is active (Blue)
  }

  const hasSlotBooked =
    student.applicationStatus === ApplicationStatus.SLOT_BOOKED ||
    Boolean(student.examSlotId);

  if (hasSlotBooked) {
    return 4; // Step 3 ("Exam Slot Booked") is COMPLETED (Green), Step 4 is active (Blue)
  }

  const hasPaidFee =
    student.applicationStatus === ApplicationStatus.REGISTRATION_FEE_PAID ||
    student.paymentStatus === PaymentStatus.PAID;

  if (hasPaidFee) {
    return 3; // Step 2 ("Registration Fee Paid") is COMPLETED (Green), Step 3 is active (Blue)
  }

  return 2; // Step 1 ("Application Created") is COMPLETED (Green), Step 2 is active (Blue)
}

export function AdmissionTimeline({ student, bookedSlot }: AdmissionTimelineProps) {
  const activeStepNumber = getActiveStepNumber(student);
  const displayStageNumber = Math.min(activeStepNumber, 5);
  const isAllCompleted = activeStepNumber > 5;

  const getSlotDetailsText = () => {
    let slotObj: ExamSlot | null = null;
    if (bookedSlot) {
      slotObj = bookedSlot;
    } else if (student.examSlotId && typeof student.examSlotId === 'object') {
      slotObj = student.examSlotId as ExamSlot;
    }

    if (slotObj?.date && slotObj?.startTime && slotObj?.endTime) {
      const dateStr = new Date(slotObj.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const startStr = new Date(slotObj.startTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const endStr = new Date(slotObj.endTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateStr} | ${startStr} - ${endStr}`;
    }
    return null;
  };

  const slotTimeText = getSlotDetailsText();

  return (
    <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>
            Application Progress & Timeline
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11.5px', marginTop: '2px', margin: 0 }}>
            Read-only authoritative admission stage tracker for <strong style={{ color: '#f8fafc' }}>{student.studentName}</strong>
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            padding: '3px 9px',
            borderRadius: '12px',
            background: isAllCompleted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            color: isAllCompleted ? '#86efac' : '#a5b4fc',
            border: `1px solid ${isAllCompleted ? 'rgba(34, 197, 94, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
            fontWeight: 600,
          }}
        >
          {isAllCompleted ? 'Stage 5 of 5 (Completed)' : `Stage ${displayStageNumber} of 5 Active`}
        </span>
      </div>

      {/* Fully Responsive Grid Container */}
      <div className="timeline-responsive-grid">
        {ADMISSION_STAGES.map((stage) => {
          const isCompleted = stage.step < activeStepNumber;
          const isCurrent = stage.step === activeStepNumber;
          const isUpcoming = stage.step > activeStepNumber;

          return (
            <div
              key={stage.key}
              style={{
                background: isCurrent
                  ? 'rgba(99, 102, 241, 0.12)'
                  : isCompleted
                  ? 'rgba(34, 197, 94, 0.06)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: isCurrent
                  ? '1px solid rgba(99, 102, 241, 0.45)'
                  : isCompleted
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '9px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                transition: 'all 0.2s ease',
                boxShadow: isCurrent
                  ? '0 4px 12px rgba(99, 102, 241, 0.15)'
                  : isCompleted
                  ? '0 2px 8px rgba(34, 197, 94, 0.08)'
                  : 'none',
                minWidth: 0,
              }}
            >
              {/* Header Icon + Step Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                  {isCompleted && (
                    <CheckCircleIcon style={{ width: '15px', height: '15px', color: '#4ade80', flexShrink: 0 }} />
                  )}
                  {isCurrent && (
                    <ClockIcon style={{ width: '15px', height: '15px', color: '#818cf8', flexShrink: 0 }} />
                  )}
                  {isUpcoming && (
                    <LockClosedIcon style={{ width: '14px', height: '14px', color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: isCompleted
                        ? '#86efac'
                        : isCurrent
                        ? '#c7d2fe'
                        : 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    STEP 0{stage.step}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '8.5px',
                    fontWeight: 600,
                    padding: '1.5px 4px',
                    borderRadius: '4px',
                    background: isCompleted
                      ? 'rgba(34, 197, 94, 0.2)'
                      : isCurrent
                      ? 'rgba(99, 102, 241, 0.25)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isCompleted
                      ? '#86efac'
                      : isCurrent
                      ? '#a5b4fc'
                      : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div style={{ marginTop: '1px', minWidth: 0 }}>
                <h4 style={{ fontSize: '11.5px', fontWeight: 600, color: '#f8fafc', margin: '0 0 2px 0', lineHeight: '1.25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={stage.title}>
                  {stage.title}
                </h4>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={stage.subtitle}>
                  {stage.subtitle}
                </p>
              </div>

              {/* Stage-Specific Contextual Meta Details */}
              <div
                style={{
                  fontSize: '10px',
                  paddingTop: '5px',
                  marginTop: 'auto',
                  borderTop: '1px border-dashed rgba(255, 255, 255, 0.08)',
                  minWidth: 0,
                }}
              >
                {stage.key === ApplicationStatus.APPLICATION_CREATED && (
                  <span style={{ color: isCompleted ? '#86efac' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    Application ID logged.
                  </span>
                )}

                {stage.key === ApplicationStatus.REGISTRATION_FEE_PAID && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                    <CreditCardIcon style={{ width: '12px', height: '12px', color: student.paymentStatus === PaymentStatus.PAID ? '#4ade80' : '#f87171', flexShrink: 0 }} />
                    <span style={{ color: student.paymentStatus === PaymentStatus.PAID ? '#86efac' : '#fca5a5', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {student.paymentStatus === PaymentStatus.PAID ? 'INR 500 Paid' : 'Unpaid - Fee Required'}
                    </span>
                  </div>
                )}

                {stage.key === ApplicationStatus.SLOT_BOOKED && (
                  <div style={{ minWidth: 0 }}>
                    {slotTimeText ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isCompleted ? '#86efac' : '#c7d2fe', minWidth: 0 }}>
                        <CalendarIcon style={{ width: '12px', height: '12px', color: isCompleted ? '#4ade80' : '#818cf8', flexShrink: 0 }} />
                        <span style={{ fontSize: '9.5px', fontWeight: 500, lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={slotTimeText}>
                          {slotTimeText}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {student.paymentStatus === PaymentStatus.PAID
                          ? 'Slot booking available'
                          : 'Requires fee payment'}
                      </span>
                    )}
                  </div>
                )}

                {stage.key === ApplicationStatus.EXAM_COMPLETED && (
                  <div style={{ minWidth: 0 }}>
                    {student.examAttendance === ExamAttendance.PRESENT ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isCompleted ? '#86efac' : '#c7d2fe', minWidth: 0 }}>
                        <DocumentTextIcon style={{ width: '12px', height: '12px', color: isCompleted ? '#4ade80' : '#818cf8', flexShrink: 0 }} />
                        <span style={{ fontSize: '9.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Present | {student.examMarks !== null && student.examMarks !== undefined ? `Marks: ${student.examMarks}/100` : 'Score pending'}
                        </span>
                      </div>
                    ) : student.examAttendance === ExamAttendance.ABSENT ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fca5a5', minWidth: 0 }}>
                        <XCircleIcon style={{ width: '12px', height: '12px', color: '#f87171', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: '9.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Marked ABSENT</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        Awaiting admin marks
                      </span>
                    )}
                  </div>
                )}

                {stage.key === ApplicationStatus.ADMISSION_COMPLETED && (
                  <div style={{ minWidth: 0 }}>
                    {student.assignedGrade ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e9d5ff', minWidth: 0 }}>
                        <AcademicCapIcon style={{ width: '12px', height: '12px', color: '#c084fc', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: '9.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Grade: {student.assignedGrade.replace('_', ' ')}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        Grade pending
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .timeline-responsive-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
        }

        @media (max-width: 768px) {
          .timeline-responsive-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }

        @media (max-width: 480px) {
          .timeline-responsive-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
