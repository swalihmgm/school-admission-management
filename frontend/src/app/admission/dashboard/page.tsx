'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { admissionsService } from '@/services/admissions.service';
import { Student, ApplicationStatus, PaymentStatus, ExamAttendance } from '@/types';
import { ApplicationStatusBadge, PaymentStatusBadge } from '@/components/status-badge';
import {
  UserGroupIcon,
  CalendarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function AdmissionDashboardPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await admissionsService.getAdmissionsList();
      setStudents(data);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to load application data.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCount = students.length;
  const createdCount = students.filter(
    (s) => s.applicationStatus === ApplicationStatus.APPLICATION_CREATED
  ).length;
  const feePaidCount = students.filter(
    (s) => s.applicationStatus === ApplicationStatus.REGISTRATION_FEE_PAID
  ).length;
  const slotBookedCount = students.filter(
    (s) => s.applicationStatus === ApplicationStatus.SLOT_BOOKED
  ).length;
  const examCompletedCount = students.filter(
    (s) => s.applicationStatus === ApplicationStatus.EXAM_COMPLETED
  ).length;
  const admissionCompletedCount = students.filter(
    (s) => s.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header Banner */}
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
          <h1 className="gradient-text" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            Admission Team Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            Welcome back, {user?.fullName}! Manage application workflows, exam evaluation results, and grade assignments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn"
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              fontSize: '12.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admission/applications"
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            Manage All Applications <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
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

      {/* Metrics Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Total Applications
            </span>
            <UserGroupIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {loading ? '...' : totalCount}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            All registered student profiles
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Slots Booked
            </span>
            <CalendarIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#c7d2fe' }}>
            {loading ? '...' : slotBookedCount}
          </div>
          <div style={{ fontSize: '11.5px', color: '#a5b4fc', marginTop: '2px' }}>
            Ready for exam evaluation
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Exams Evaluated
            </span>
            <AcademicCapIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fde047' }}>
            {loading ? '...' : examCompletedCount}
          </div>
          <div style={{ fontSize: '11.5px', color: '#fef08a', marginTop: '2px' }}>
            Ready for grade assignment
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Admissions Finalized
            </span>
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#86efac' }}>
            {loading ? '...' : admissionCompletedCount}
          </div>
          <div style={{ fontSize: '11.5px', color: '#4ade80', marginTop: '2px' }}>
            Grade assigned & completed
          </div>
        </div>
      </div>

      {/* Application Status Summary Breakdown */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', marginBottom: '14px' }}>
          Application Status Summary
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#93c5fd', fontWeight: 600 }}>1. Created</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {createdCount}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Initial submissions</span>
          </div>

          <div style={{ background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.2)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#5eead4', fontWeight: 600 }}>2. Fee Paid</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {feePaidCount}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Awaiting slot booking</span>
          </div>

          <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#c084fc', fontWeight: 600 }}>3. Slot Booked</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {slotBookedCount}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Needs result recording</span>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#fcd34d', fontWeight: 600 }}>4. Exam Evaluated</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {examCompletedCount}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Needs grade assignment</span>
          </div>

          <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#86efac', fontWeight: 600 }}>5. Completed</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {admissionCompletedCount}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Finalized admissions</span>
          </div>
        </div>
      </div>

      {/* Recent Applications Quick Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Recent Applications Overview
          </h2>
          <Link
            href="/admission/applications"
            style={{ fontSize: '12.5px', color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
          >
            View All Applications <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '20px 0', textAlign: 'center' }}>
            Loading application records...
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No student application records found in the database.
          </div>
        ) : (
          <>
            {/* Mobile View: Simplified cards with necessary details and Inspect button */}
            <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {students.slice(0, 5).map((student) => {
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
                        href={`/admission/applications?inspect=${studentId}`}
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
                        <span>Inspect & Manage</span>
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
                    <th style={{ padding: '10px 14px' }}>Exam Score</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 5).map((student) => {
                    const studentId = student._id || student.id;
                    const parentName =
                      typeof student.parentId === 'object' && student.parentId !== null
                        ? (student.parentId as any).fullName || (student.parentId as any).email
                        : 'Parent Info Recorded';

                    return (
                      <tr key={studentId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14.5px' }}>
                            {student.studentName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ID: <code style={{ color: '#a5b4fc' }}>{studentId}</code>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Parent: <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{parentName}</span>
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

                        <td style={{ padding: '10px 14px', fontSize: '12.5px' }}>
                          {student.examAttendance === ExamAttendance.PRESENT ? (
                            <span style={{ color: '#4ade80', fontWeight: 600 }}>
                              Present ({student.examMarks !== null && student.examMarks !== undefined ? `${student.examMarks}/100` : 'No score'})
                            </span>
                          ) : student.examAttendance === ExamAttendance.ABSENT ? (
                            <span style={{ color: '#f87171', fontWeight: 600 }}>ABSENT</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Link
                            href={`/admission/applications?inspect=${studentId}`}
                            className="btn btn-primary"
                            style={{
                              fontSize: '11.5px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Inspect & Manage</span> <ArrowRightIcon className="w-3.5 h-3.5" />
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
