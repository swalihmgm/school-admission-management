'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { admissionsService } from '@/services/admissions.service';
import { Student, ApplicationStatus } from '@/types';
import { ApplicationStatusBadge } from '@/components/status-badge';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function AdminCompletedStudentsPage() {
  const [completedStudents, setCompletedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const fetchCompletedStudents = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await admissionsService.getAdmissionsList(
        ApplicationStatus.ADMISSION_COMPLETED
      );
      setCompletedStudents(data);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to retrieve completed student admissions.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedStudents();
  }, [fetchCompletedStudents]);

  const filteredStudents = useMemo(() => {
    return completedStudents.filter((s) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameMatch = s.studentName.toLowerCase().includes(q);
        const idMatch = (s._id || s.id || '').toLowerCase().includes(q);
        const schoolMatch = s.previousSchool.toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !schoolMatch) return false;
      }

      if (gradeFilter !== 'ALL' && s.assignedGrade !== gradeFilter && s.applyingGrade !== gradeFilter) {
        return false;
      }

      return true;
    });
  }, [completedStudents, searchTerm, gradeFilter]);

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    completedStudents.forEach((s) => {
      const g = s.assignedGrade || s.applyingGrade;
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [completedStudents]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CheckBadgeIcon className="w-6 h-6 text-emerald-400" />
            <h1 className="gradient-text" style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
              Finalized Students Directory
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            List of student applications with finalized grade assignments and completed admission workflows.
          </p>
        </div>

        <button
          onClick={() => fetchCompletedStudents(true)}
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
          Refresh Records
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

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Finalized Students
            </span>
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#86efac' }}>
            {loading ? '...' : completedStudents.length}
          </div>
          <div style={{ fontSize: '11.5px', color: '#4ade80', marginTop: '2px' }}>
            Admissions completed
          </div>
        </div>

        {['GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4'].map((g) => (
          <div key={g} className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                {g.replace('_', ' ')} Enrolled
              </span>
              <AcademicCapIcon className="w-4 h-4 text-purple-400" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc' }}>
              {loading ? '...' : gradeCounts[g] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar & Grade Filter */}
      <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <MagnifyingGlassIcon
            className="w-4 h-4 text-slate-400"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search student name, application ID, or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', width: '100%', fontSize: '13px' }}
          />
        </div>

        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="form-input"
          style={{ background: 'rgba(15, 23, 42, 0.8)', fontSize: '12.5px', width: 'auto', padding: '7px 10px' }}
        >
          <option value="ALL">All Assigned Grades</option>
          <option value="GRADE_1">Grade 1</option>
          <option value="GRADE_2">Grade 2</option>
          <option value="GRADE_3">Grade 3</option>
          <option value="GRADE_4">Grade 4</option>
        </select>
      </div>

      {/* Completed Students Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Finalized Enrolled Students ({filteredStudents.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '28px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ArrowPathIcon className="w-4 h-4 animate-spin" style={{ color: '#818cf8' }} />
            <span>Loading completed admissions...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No finalized student admissions match the filter criteria.
          </div>
        ) : (
          <>
            {/* Mobile View: Simplified cards with necessary details and Inspect button */}
            <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredStudents.map((student) => {
                const studentId = student._id || student.id;
                const gradeStr = (student.assignedGrade || student.applyingGrade).replace('_', ' ');

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
                        <div style={{ fontSize: '12px', color: '#c084fc', fontWeight: 600, marginTop: '2px' }}>
                          {gradeStr}
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
                        <span>Inspect Record</span>
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
                    <th style={{ padding: '10px 14px' }}>Assigned Grade</th>
                    <th style={{ padding: '10px 14px' }}>Entrance Score</th>
                    <th style={{ padding: '10px 14px' }}>Previous School</th>
                    <th style={{ padding: '10px 14px' }}>Application Status</th>
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

                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#e9d5ff', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <AcademicCapIcon className="w-3.5 h-3.5 text-purple-300" />
                            {(student.assignedGrade || student.applyingGrade).replace('_', ' ')}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: 700 }}>
                          {student.examMarks !== null && student.examMarks !== undefined ? `${student.examMarks} / 100` : 'Score N/A'}
                        </td>

                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {student.previousSchool}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <ApplicationStatusBadge status={student.applicationStatus} />
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <Link
                            href={`/admission/applications?inspect=${studentId}`}
                            className="btn btn-primary"
                            style={{
                              fontSize: '11.5px',
                              padding: '5px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            Inspect Record <ArrowRightIcon className="w-3.5 h-3.5" />
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
