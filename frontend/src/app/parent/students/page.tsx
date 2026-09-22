'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { studentsService } from '@/services/students.service';
import { Student, ApplicationStatus, PaymentStatus, ExamAttendance } from '@/types';
import { ApplicationStatusBadge, PaymentStatusBadge } from '@/components/status-badge';
import {
  PlusIcon,
  AcademicCapIcon,
  CreditCardIcon,
  CalendarIcon,
  ArrowRightIcon,
  LockClosedIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function ParentStudentsListPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStudents() {
      try {
        setLoading(true);
        const data = await studentsService.getMyStudents();
        if (isMounted) {
          setStudents(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to retrieve student applications. Please try again.';
          setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1
            className="gradient-text"
            style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}
          >
            My Student Applications
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            View and manage admission applications for your children.
          </p>
        </div>
        <Link
          href="/parent/students/new"
          className="btn btn-primary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusIcon className="w-4 h-4" /> Create New Application
        </Link>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#fca5a5',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <div
            style={{
              padding: '28px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13.5px',
            }}
          >
            Loading your student applications...
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <AcademicCapIcon className="w-8 h-8 text-indigo-400" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: '#f8fafc' }}>
              No Student Applications Found
            </h3>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '13.5px',
                maxWidth: '440px',
                margin: '0 auto 18px auto',
              }}
            >
              You haven&apos;t submitted any student applications yet. Get started by creating an application for Grade 1, 2, 3, or 4.
            </p>
            <Link href="/parent/students/new" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PlusIcon className="w-4 h-4" /> Create Application
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {students.map((student) => {
              const studentId = student._id || student.id;
              const dob = new Date(student.dateOfBirth).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={studentId}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                          {student.studentName}
                        </h3>
                        <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>
                          {student.applyingGrade.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <ApplicationStatusBadge status={student.applicationStatus} />
                        <PaymentStatusBadge status={student.paymentStatus} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Date of Birth:</span>
                        <strong style={{ color: '#e2e8f0' }}>{dob}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Gender:</span>
                        <strong style={{ color: '#e2e8f0' }}>{student.gender}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Previous School:</span>
                        <strong style={{ color: '#e2e8f0' }}>{student.previousSchool}</strong>
                      </div>
                      
                      {student.examAttendance && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px border-dashed rgba(255,255,255,0.08)' }}>
                          <span>Exam Attendance:</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: student.examAttendance === ExamAttendance.PRESENT ? '#4ade80' : '#f87171' }}>
                            {student.examAttendance === ExamAttendance.PRESENT ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                            {student.examAttendance}
                          </span>
                        </div>
                      )}
                      
                      {student.examAttendance === ExamAttendance.PRESENT && student.examMarks !== null && student.examMarks !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Exam Marks:</span>
                          <strong style={{ color: '#38bdf8' }}>{student.examMarks} / 100</strong>
                        </div>
                      )}

                      {student.examAttendance === ExamAttendance.ABSENT && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                          <span>Exam Marks:</span>
                          <span style={{ fontSize: '11.5px', fontWeight: 500 }}>No Marks (Absent)</span>
                        </div>
                      )}

                      {student.assignedGrade && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e9d5ff' }}>
                          <span>Assigned Grade:</span>
                          <strong style={{ color: '#c084fc' }}>{student.assignedGrade.replace('_', ' ')}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {student.paymentStatus === PaymentStatus.PAID ? (
                        <>
                          <LockClosedIcon className="w-3.5 h-3.5 text-slate-400" /> Paid (Read-only)
                        </>
                      ) : (
                        <>
                          <PencilSquareIcon className="w-3.5 h-3.5 text-slate-400" /> Editable (Unpaid)
                        </>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {student.paymentStatus === PaymentStatus.UNPAID && student.applicationStatus === ApplicationStatus.APPLICATION_CREATED && (
                        <Link
                          href={`/parent/students/${studentId}`}
                          className="btn btn-primary"
                          style={{
                            fontSize: '11.5px',
                            padding: '5px 10px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CreditCardIcon className="w-3.5 h-3.5" /> Pay Fee
                        </Link>
                      )}
                      {student.paymentStatus === PaymentStatus.PAID && student.applicationStatus !== ApplicationStatus.EXAM_COMPLETED && student.applicationStatus !== ApplicationStatus.ADMISSION_COMPLETED && (
                        <Link
                          href={`/parent/students/${studentId}`}
                          className="btn btn-primary"
                          style={{
                            fontSize: '11.5px',
                            padding: '5px 10px',
                            textDecoration: 'none',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CalendarIcon className="w-3.5 h-3.5" /> {student.applicationStatus === ApplicationStatus.SLOT_BOOKED ? 'View Slot' : 'Book Slot'}
                        </Link>
                      )}
                      <Link
                        href={`/parent/students/${studentId}`}
                        className="btn"
                        style={{
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#a5b4fc',
                          fontSize: '11.5px',
                          padding: '5px 10px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Details <ArrowRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
