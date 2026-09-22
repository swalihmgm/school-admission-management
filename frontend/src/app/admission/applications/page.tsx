'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { admissionsService } from '@/services/admissions.service';
import {
  Student,
  ApplicationStatus,
  PaymentStatus,
  ExamAttendance,
  Grade,
  ExamSlot,
  UpdateExamResultDto,
  AssignCourseDto,
} from '@/types';
import { ApplicationStatusBadge, PaymentStatusBadge } from '@/components/status-badge';
import { AdmissionTimeline } from '@/components/admission-timeline';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  PencilSquareIcon,
  LockClosedIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

function AdminApplicationsContent() {
  const searchParams = useSearchParams();
  const inspectIdParam = searchParams.get('inspect');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Inspection Modal / Drawer State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'score' | 'course'>('details');

  // Exam Result Form State
  const [resultAttendance, setResultAttendance] = useState<ExamAttendance>(ExamAttendance.PRESENT);
  const [resultMarks, setResultMarks] = useState<string>('');
  const [savingResult, setSavingResult] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [resultSuccess, setResultSuccess] = useState<string | null>(null);

  // Grade Assignment Form State
  const [targetGrade, setTargetGrade] = useState<Grade>(Grade.GRADE_1);
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null);

  const tabParam = searchParams.get('tab');
  const statusParam = searchParams.get('status');

  useEffect(() => {
    if (tabParam === 'score') {
      setModalTab('score');
    } else if (tabParam === 'course') {
      setModalTab('course');
    } else if (tabParam === 'details') {
      setModalTab('details');
    }
  }, [tabParam]);

  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [statusParam]);

  const fetchApplications = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await admissionsService.getAdmissionsList();
      setStudents(data);

      // If a student is currently selected in modal, refresh their data too
      if (selectedStudent) {
        const updated = data.find((s) => (s._id || s.id) === (selectedStudent._id || selectedStudent.id));
        if (updated) {
          setSelectedStudent(updated);
        }
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to retrieve application records.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    fetchApplications();
  }, []);

  // Handle URL inspect parameter and tab parameter auto-open popup
  useEffect(() => {
    if (students.length > 0) {
      if (inspectIdParam) {
        const match = students.find((s) => (s._id || s.id) === inspectIdParam);
        if (match) {
          const targetTab = tabParam === 'score' ? 'score' : tabParam === 'course' ? 'course' : 'details';
          openInspectionModal(match, targetTab);
          return;
        }
      }

      if (tabParam === 'course') {
        const candidate =
          students.find((s) => s.applicationStatus === ApplicationStatus.EXAM_COMPLETED) ||
          students[0];
        if (candidate) {
          openInspectionModal(candidate, 'course');
        }
      } else if (tabParam === 'score') {
        const candidate =
          students.find((s) => s.applicationStatus === ApplicationStatus.SLOT_BOOKED) ||
          students[0];
        if (candidate) {
          openInspectionModal(candidate, 'score');
        }
      }
    }
  }, [inspectIdParam, tabParam, students]);

  // Client-side filtering logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search term filter (student name, application ID, previous school)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const nameMatch = s.studentName.toLowerCase().includes(query);
        const idMatch = (s._id || s.id || '').toLowerCase().includes(query);
        const schoolMatch = s.previousSchool.toLowerCase().includes(query);
        if (!nameMatch && !idMatch && !schoolMatch) {
          return false;
        }
      }

      // Application status filter
      if (statusFilter !== 'ALL' && s.applicationStatus !== statusFilter) {
        return false;
      }

      // Payment status filter
      if (paymentFilter !== 'ALL' && s.paymentStatus !== paymentFilter) {
        return false;
      }

      // Applying grade filter
      if (gradeFilter !== 'ALL' && s.applyingGrade !== gradeFilter) {
        return false;
      }

      return true;
    });
  }, [students, searchTerm, statusFilter, paymentFilter, gradeFilter]);

  // Open modal and pre-fill form fields
  const openInspectionModal = (student: Student, tab?: 'details' | 'score' | 'course') => {
    setSelectedStudent(student);
    if (tab) {
      setModalTab(tab);
    } else if (tabParam === 'score' || tabParam === 'course' || tabParam === 'details') {
      setModalTab(tabParam as any);
    } else {
      setModalTab('details');
    }
    setResultError(null);
    setResultSuccess(null);
    setGradeError(null);
    setGradeSuccess(null);

    // Pre-fill exam result form
    if (student.examAttendance) {
      setResultAttendance(student.examAttendance);
      setResultMarks(
        student.examAttendance === ExamAttendance.PRESENT && student.examMarks !== null && student.examMarks !== undefined
          ? String(student.examMarks)
          : ''
      );
    } else {
      setResultAttendance(ExamAttendance.PRESENT);
      setResultMarks('');
    }

    // Pre-fill grade assignment form
    if (student.assignedGrade) {
      setTargetGrade(student.assignedGrade);
    } else {
      setTargetGrade(student.applyingGrade || Grade.GRADE_1);
    }
  };

  const closeInspectionModal = () => {
    setSelectedStudent(null);
    setResultError(null);
    setResultSuccess(null);
    setGradeError(null);
    setGradeSuccess(null);
  };

  // Keyboard accessibility: Escape key listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStudent) {
        closeInspectionModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudent]);

  // Exam Result Submission Handler (PATCH /admissions/:id/exam-result)
  const handleSaveExamResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || savingResult) return;

    setResultError(null);
    setResultSuccess(null);

    const studentId = selectedStudent._id || selectedStudent.id;
    if (!studentId) return;

    // UX Validation
    let marksVal: number | null = null;
    if (resultAttendance === ExamAttendance.PRESENT) {
      if (resultMarks === '' || resultMarks === null || resultMarks === undefined) {
        setResultError('Test marks are required when attendance is PRESENT.');
        return;
      }
      const parsed = Number(resultMarks);
      if (isNaN(parsed) || parsed < 0 || parsed > 100 || !Number.isInteger(parsed)) {
        setResultError('Test marks must be an integer between 0 and 100 inclusive.');
        return;
      }
      marksVal = parsed;
    } else {
      // ABSENT forces marks to null
      marksVal = null;
    }

    const dto: UpdateExamResultDto = {
      examAttendance: resultAttendance,
      examMarks: marksVal,
    };

    try {
      setSavingResult(true);
      const updatedStudent = await admissionsService.updateExamResult(studentId, dto);
      setSelectedStudent(updatedStudent);
      setResultSuccess(
        `Exam result recorded successfully as ${dto.examAttendance}${
          dto.examAttendance === ExamAttendance.PRESENT ? ` with score ${dto.examMarks}/100` : ' (No marks)'
        }. Application status updated to EXAM_COMPLETED.`
      );

      // Refresh applications list
      const refreshedList = await admissionsService.getAdmissionsList();
      setStudents(refreshedList);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to record exam result.';
      setResultError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSavingResult(false);
    }
  };

  // Grade Assignment Submission Handler (PATCH /admissions/:id/course)
  const handleAssignGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || savingGrade) return;

    setGradeError(null);
    setGradeSuccess(null);

    const studentId = selectedStudent._id || selectedStudent.id;
    if (!studentId) return;

    const dto: AssignCourseDto = {
      assignedGrade: targetGrade,
    };

    try {
      setSavingGrade(true);
      const updatedStudent = await admissionsService.assignCourse(studentId, dto);
      setSelectedStudent(updatedStudent);
      setGradeSuccess(
        `Grade assigned successfully as ${dto.assignedGrade.replace('_', ' ')}. Application status updated to ADMISSION_COMPLETED.`
      );

      // Refresh applications list
      const refreshedList = await admissionsService.getAdmissionsList();
      setStudents(refreshedList);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to assign grade.';
      setGradeError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSavingGrade(false);
    }
  };

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
            Student Applications
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            View student applications, update entrance exam scores, and manage final admissions.
          </p>
        </div>

        <button
          onClick={() => fetchApplications(true)}
          disabled={isRefreshing}
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
          <ArrowPathIcon className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Records'}
        </button>
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

      {/* Client-Side Search & Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <MagnifyingGlassIcon
            className="w-4 h-4 text-slate-400"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search student name, ID, or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', width: '100%', fontSize: '13px' }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="filter-group-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FunnelIcon className="w-4 h-4 text-indigo-400" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
            style={{ background: 'rgba(15, 23, 42, 0.8)', fontSize: '12.5px', padding: '7px 10px' }}
          >
            <option value="ALL">All Application Statuses</option>
            <option value={ApplicationStatus.APPLICATION_CREATED}>Application Created</option>
            <option value={ApplicationStatus.REGISTRATION_FEE_PAID}>Registration Fee Paid</option>
            <option value={ApplicationStatus.SLOT_BOOKED}>Slot Booked</option>
            <option value={ApplicationStatus.EXAM_COMPLETED}>Exam Completed</option>
            <option value={ApplicationStatus.ADMISSION_COMPLETED}>Admission Completed</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="form-input"
            style={{ background: 'rgba(15, 23, 42, 0.8)', fontSize: '12.5px', padding: '7px 10px' }}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value={PaymentStatus.PAID}>Paid</option>
            <option value={PaymentStatus.UNPAID}>Unpaid</option>
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="form-input"
            style={{ background: 'rgba(15, 23, 42, 0.8)', fontSize: '12.5px', padding: '7px 10px' }}
          >
            <option value="ALL">All Applying Grades</option>
            <option value={Grade.GRADE_1}>Grade 1</option>
            <option value={Grade.GRADE_2}>Grade 2</option>
            <option value={Grade.GRADE_3}>Grade 3</option>
            <option value={Grade.GRADE_4}>Grade 4</option>
          </select>

          {(searchTerm || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || gradeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
                setGradeFilter('ALL');
              }}
              className="btn"
              style={{
                fontSize: '11.5px',
                padding: '7px 12px',
                background: 'rgba(255,255,255,0.05)',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Student Applications ({filteredStudents.length})
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredStudents.length} of {students.length} records
          </span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '28px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ArrowPathIcon className="w-4 h-4 animate-spin" style={{ color: '#818cf8' }} />
            <span>Loading applications from backend...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No student application records match the selected filter criteria.
          </div>
        ) : (
          <>
            {/* Mobile View: Simplified cards with necessary details and Inspect button */}
            <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredStudents.map((student) => {
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
                      <button
                        onClick={() => openInspectionModal(student)}
                        className="btn btn-primary"
                        style={{
                          fontSize: '12px',
                          padding: '6px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        <span>Inspect & Manage</span>
                      </button>
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
                    <th style={{ padding: '10px 14px' }}>Final Grade</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
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
                            <span style={{ color: '#4ade80', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Present ({student.examMarks !== null && student.examMarks !== undefined ? `${student.examMarks}/100` : 'No score'})
                            </span>
                          ) : student.examAttendance === ExamAttendance.ABSENT ? (
                            <span style={{ color: '#f87171', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircleIcon className="w-3.5 h-3.5" /> ABSENT (No Marks)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', fontSize: '12.5px' }}>
                          {student.assignedGrade ? (
                            <span style={{ color: '#c084fc', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AcademicCapIcon className="w-3.5 h-3.5" /> {student.assignedGrade.replace('_', ' ')}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Pending Grade Assignment</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => openInspectionModal(student)}
                            className="btn btn-primary"
                            style={{
                              fontSize: '11.5px',
                              padding: '5px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                            <span>View & Update</span>
                          </button>
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

      {/* Accessible Application Inspection & Management Modal / Drawer */}
      {selectedStudent && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
          onClick={closeInspectionModal}
        >
          <div
            className="glass-card modal-card"
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              position: 'relative',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Modal Header & Close Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0, wordBreak: 'break-word' }}>
                  {selectedStudent.studentName}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <ApplicationStatusBadge status={selectedStudent.applicationStatus} />
                  <PaymentStatusBadge status={selectedStudent.paymentStatus} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px', margin: 0, wordBreak: 'break-all' }}>
                  Application ID: <code style={{ color: '#a5b4fc' }}>{selectedStudent._id || selectedStudent.id}</code>
                </p>
              </div>

              <button
                onClick={closeInspectionModal}
                className="btn"
                aria-label="Close modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  padding: '6px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Modal Tab Navigation Buttons */}
            <div className="modal-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setModalTab('details')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: modalTab === 'details' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: modalTab === 'details' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: modalTab === 'details' ? '#a5b4fc' : '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>Student Details & Status</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('score')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: modalTab === 'score' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: modalTab === 'score' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: modalTab === 'score' ? '#60a5fa' : '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <PencilSquareIcon className="w-4 h-4" />
                <span>Add / Edit Score</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('course')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: modalTab === 'course' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: modalTab === 'course' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: modalTab === 'course' ? '#c084fc' : '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <AcademicCapIcon className="w-4 h-4" />
                <span>Assign Grade</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Tab 1: Student Details & Application Status Timeline */}
              {modalTab === 'details' && (
                <>
                  <AdmissionTimeline student={selectedStudent} />

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '10px', margin: 0 }}>
                      Student Record Details
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Applying Grade</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedStudent.applyingGrade.replace('_', ' ')}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Date of Birth</span>
                        <strong style={{ color: '#f8fafc' }}>{new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Gender</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedStudent.gender}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Previous School</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedStudent.previousSchool}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Parent Details</span>
                        <strong style={{ color: '#f8fafc' }}>
                          {typeof selectedStudent.parentId === 'object' && selectedStudent.parentId !== null
                            ? `${(selectedStudent.parentId as any).fullName || 'Parent'} (${(selectedStudent.parentId as any).email || ''})`
                            : String(selectedStudent.parentId || 'N/A')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Add / Record Score Form */}
              {modalTab === 'score' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <PencilSquareIcon className="w-4 h-4 text-blue-400" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      Record / Edit Entrance Exam Result
                    </h3>
                  </div>

                  {/* Workflow Prerequisites UX Notice */}
                  {selectedStudent.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED ? (
                    <div style={{ padding: '10px 14px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', color: '#fef08a', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LockClosedIcon className="w-4 h-4 flex-shrink-0 text-amber-400" />
                      <span><strong>Exam Results Locked:</strong> Exam results cannot be modified after admission completion.</span>
                    </div>
                  ) : (selectedStudent.applicationStatus === ApplicationStatus.APPLICATION_CREATED || selectedStudent.applicationStatus === ApplicationStatus.REGISTRATION_FEE_PAID || !selectedStudent.examSlotId) ? (
                    <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span><strong>Prerequisite Required:</strong> Student must have a booked exam slot before recording entrance exam results.</span>
                    </div>
                  ) : null}

                  {resultSuccess && (
                    <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#86efac', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{resultSuccess}</span>
                    </div>
                  )}

                  {resultError && (
                    <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{resultError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveExamResult} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Attendance Radio Buttons */}
                    <div>
                      <label className="form-label" style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                        Exam Attendance *
                      </label>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13.5px', color: '#f8fafc' }}>
                          <input
                            type="radio"
                            name="examAttendance"
                            value={ExamAttendance.PRESENT}
                            checked={resultAttendance === ExamAttendance.PRESENT}
                            onChange={() => {
                              setResultAttendance(ExamAttendance.PRESENT);
                              setResultError(null);
                            }}
                            disabled={selectedStudent.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED}
                          />
                          <span style={{ fontWeight: 600, color: '#4ade80' }}>PRESENT</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13.5px', color: '#f8fafc' }}>
                          <input
                            type="radio"
                            name="examAttendance"
                            value={ExamAttendance.ABSENT}
                            checked={resultAttendance === ExamAttendance.ABSENT}
                            onChange={() => {
                              setResultAttendance(ExamAttendance.ABSENT);
                              setResultMarks('');
                              setResultError(null);
                            }}
                            disabled={selectedStudent.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED}
                          />
                          <span style={{ fontWeight: 600, color: '#f87171' }}>ABSENT</span>
                        </label>
                      </div>
                    </div>

                    {/* Marks Input */}
                    <div>
                      <label className="form-label" htmlFor="examMarksInput" style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
                        Test Marks (0 to 100 inclusive) {resultAttendance === ExamAttendance.PRESENT ? '*' : '(Cleared for ABSENT)'}
                      </label>
                      <input
                        id="examMarksInput"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        placeholder={resultAttendance === ExamAttendance.PRESENT ? 'Enter marks (0-100)' : 'Marks clear to null when ABSENT'}
                        value={resultMarks}
                        onChange={(e) => setResultMarks(e.target.value)}
                        disabled={resultAttendance === ExamAttendance.ABSENT || selectedStudent.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED}
                        className="form-input"
                        style={{
                          background: resultAttendance === ExamAttendance.ABSENT ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.8)',
                          color: resultAttendance === ExamAttendance.ABSENT ? 'var(--text-muted)' : '#f8fafc',
                          maxWidth: '220px',
                          fontSize: '13px',
                        }}
                      />
                      {resultAttendance === ExamAttendance.ABSENT && (
                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px', margin: 0 }}>
                          Marks will be saved as null on the server for ABSENT candidates.
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={
                          savingResult ||
                          selectedStudent.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED ||
                          selectedStudent.applicationStatus === ApplicationStatus.APPLICATION_CREATED ||
                          selectedStudent.applicationStatus === ApplicationStatus.REGISTRATION_FEE_PAID ||
                          !selectedStudent.examSlotId
                        }
                        className="btn btn-primary"
                        style={{ fontSize: '12.5px', padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        {savingResult ? 'Saving Result...' : 'Save Exam Result'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: Assign Course Form */}
              {modalTab === 'course' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <AcademicCapIcon className="w-4 h-4 text-purple-400" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      Assign Final Course / Grade
                    </h3>
                  </div>

                  {/* Workflow Prerequisites UX Notice */}
                  {selectedStudent.examAttendance === ExamAttendance.ABSENT ? (
                    <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span><strong>Cannot Assign Grade:</strong> Candidate was recorded as ABSENT for the entrance exam.</span>
                    </div>
                  ) : (selectedStudent.applicationStatus !== ApplicationStatus.EXAM_COMPLETED && selectedStudent.applicationStatus !== ApplicationStatus.ADMISSION_COMPLETED) ? (
                    <div style={{ padding: '10px 14px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', color: '#fef08a', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-amber-400" />
                      <span><strong>Prerequisite Required:</strong> Student application must complete the entrance exam evaluation stage before course/grade assignment.</span>
                    </div>
                  ) : null}

                  {gradeSuccess && (
                    <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#86efac', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{gradeSuccess}</span>
                    </div>
                  )}

                  {gradeError && (
                    <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{gradeError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAssignGrade} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="form-label" htmlFor="assignedGradeSelect" style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
                        Select Assigned Grade *
                      </label>
                      <select
                        id="assignedGradeSelect"
                        value={targetGrade}
                        onChange={(e) => setTargetGrade(e.target.value as Grade)}
                        className="form-input"
                        style={{ background: 'rgba(15, 23, 42, 0.8)', maxWidth: '240px', fontSize: '13px' }}
                        disabled={
                          selectedStudent.examAttendance === ExamAttendance.ABSENT ||
                          (selectedStudent.applicationStatus !== ApplicationStatus.EXAM_COMPLETED &&
                            selectedStudent.applicationStatus !== ApplicationStatus.ADMISSION_COMPLETED)
                        }
                      >
                        <option value={Grade.GRADE_1}>Grade 1</option>
                        <option value={Grade.GRADE_2}>Grade 2</option>
                        <option value={Grade.GRADE_3}>Grade 3</option>
                        <option value={Grade.GRADE_4}>Grade 4</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={
                          savingGrade ||
                          selectedStudent.examAttendance === ExamAttendance.ABSENT ||
                          (selectedStudent.applicationStatus !== ApplicationStatus.EXAM_COMPLETED &&
                            selectedStudent.applicationStatus !== ApplicationStatus.ADMISSION_COMPLETED)
                        }
                        className="btn btn-primary"
                        style={{
                          fontSize: '12.5px',
                          padding: '7px 16px',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <AcademicCapIcon className="w-3.5 h-3.5" />
                        {savingGrade ? 'Assigning Grade...' : selectedStudent.assignedGrade ? 'Update Assigned Grade' : 'Assign Grade & Finalize'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading application management...
        </div>
      }
    >
      <AdminApplicationsContent />
    </Suspense>
  );
}
