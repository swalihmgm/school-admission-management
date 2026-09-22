'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { studentsService } from '@/services/students.service';
import { Student, ApplicationStatus, PaymentStatus } from '@/types';
import { ApplicationStatusBadge, PaymentStatusBadge } from '@/components/status-badge';
import {
  PlusIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStudents() {
      try {
        setLoading(true);
        const data = await studentsService.getMyStudents();
        if (isMounted) {
          setStudents(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          const msg = err.response?.data?.message || err.message || 'Failed to load student applications';
          setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStudents();
    return () => {
      isMounted = false;
    };
  }, []);

  const getContextualAction = (student: Student) => {
    const studentId = student._id || student.id;
    const href = `/parent/students/${studentId}`;

    if (student.paymentStatus === PaymentStatus.UNPAID) {
      return {
        href,
        label: 'Pay Fee (₹500)',
        icon: CreditCardIcon,
        style: {
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          color: '#4ade80',
        },
      };
    }

    if (student.applicationStatus === ApplicationStatus.REGISTRATION_FEE_PAID) {
      return {
        href,
        label: 'Book Exam Slot',
        icon: CalendarIcon,
        style: {
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          color: '#818cf8',
        },
      };
    }

    if (student.applicationStatus === ApplicationStatus.SLOT_BOOKED) {
      return {
        href,
        label: 'View / Reschedule Slot',
        icon: ClockIcon,
        style: {
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#38bdf8',
        },
      };
    }

    if (student.applicationStatus === ApplicationStatus.EXAM_COMPLETED) {
      return {
        href,
        label: 'View Exam Score',
        icon: DocumentTextIcon,
        style: {
          background: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          color: '#c084fc',
        },
      };
    }

    if (student.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED) {
      return {
        href,
        label: 'View Admission',
        icon: CheckCircleIcon,
        style: {
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          color: '#4ade80',
        },
      };
    }

    return {
      href,
      label: 'View Details',
      icon: ArrowRightIcon,
      style: {
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#f8fafc',
      },
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
          Parent Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
          Welcome back, {user?.fullName}! Track and manage your children&apos;s school admission applications.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Quick Action
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', marginBottom: '6px', color: '#f8fafc' }}>
              New Student Application
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '14px' }}>
              Start a new admission application for your child for Grades 1 through 4.
            </p>
          </div>
          <Link
            href="/parent/students/new"
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <PlusIcon className="w-4 h-4" /> Create New Application
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Overview
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', marginBottom: '6px', color: '#f8fafc' }}>
              {loading ? '...' : students.length} Active Application{students.length === 1 ? '' : 's'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '14px' }}>
              View status, update student details, and track your admission progress.
            </p>
          </div>
          <Link
            href="/parent/students"
            className="btn"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <UserGroupIcon className="w-4 h-4" /> View All Applications
          </Link>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Recent Student Applications</h2>
          <Link href="/parent/students" style={{ fontSize: '13px', color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
            View All <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '20px 0', textAlign: 'center' }}>
            Loading applications...
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <AcademicCapIcon className="w-8 h-8 text-indigo-400" style={{ margin: '0 auto 10px auto' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '14px' }}>
              No student applications submitted yet.
            </p>
            <Link href="/parent/students/new" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PlusIcon className="w-4 h-4" /> Submit Your First Application
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile View: Simplified cards with necessary details and View Details button */}
            <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {students.map((student) => {
                const studentId = student._id || student.id;
                return (
                  <div
                    key={studentId}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '15px' }}>
                          {student.studentName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: 500, marginTop: '2px' }}>
                          {student.applyingGrade.replace('_', ' ')}
                        </div>
                      </div>
                      <ApplicationStatusBadge status={student.applicationStatus} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <Link
                        href={`/parent/students/${studentId}`}
                        className="btn btn-primary"
                        style={{
                          fontSize: '12px',
                          padding: '6px 14px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>View Details</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full responsive table */}
            <div className="table-responsive hide-mobile">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px 14px' }}>Student Profile</th>
                    <th style={{ padding: '10px 14px' }}>Applying Grade</th>
                    <th style={{ padding: '10px 14px' }}>Application Status</th>
                    <th style={{ padding: '10px 14px' }}>Payment</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const action = getContextualAction(student);
                    const IconComp = action.icon;
                    const studentId = student._id || student.id;

                    return (
                      <tr key={studentId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14.5px' }}>
                            {student.studentName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ID: <code style={{ color: '#a5b4fc' }}>{studentId}</code>
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {student.applyingGrade.replace('_', ' ')}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <ApplicationStatusBadge status={student.applicationStatus} />
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <PaymentStatusBadge status={student.paymentStatus} />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <Link
                            href={action.href}
                            className="btn"
                            style={{
                              ...action.style,
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                            <span>{action.label}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
