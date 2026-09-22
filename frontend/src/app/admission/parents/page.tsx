'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { admissionsService } from '@/services/admissions.service';
import { ParentUser } from '@/types';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowRightIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function AdminParentsPage() {
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<ParentUser | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchParents = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await admissionsService.getParentsList();
      setParents(data);

      if (selectedParent) {
        const updated = data.find((p) => (p._id || p.id) === (selectedParent._id || selectedParent.id));
        if (updated) setSelectedParent(updated);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to retrieve parent user records.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedParent]);

  useEffect(() => {
    fetchParents();
  }, []);

  const filteredParents = useMemo(() => {
    if (!searchTerm.trim()) return parents;
    const q = searchTerm.toLowerCase().trim();
    return parents.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
    );
  }, [parents, searchTerm]);

  const totalApplications = parents.reduce((acc, p) => acc + (p.studentsCount || 0), 0);

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
            Registered Parents Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            Inspect registered parent profiles, contact details, and their associated student applications.
          </p>
        </div>

        <button
          onClick={() => fetchParents(true)}
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

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Registered Parents
            </span>
            <UserGroupIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {loading ? '...' : parents.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Active parent user accounts
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Associated Applications
            </span>
            <AcademicCapIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#c7d2fe' }}>
            {loading ? '...' : totalApplications}
          </div>
          <div style={{ fontSize: '11.5px', color: '#a5b4fc', marginTop: '2px' }}>
            Across all parent accounts
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MagnifyingGlassIcon
            className="w-4 h-4 text-slate-400"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search parent name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', width: '100%', fontSize: '13px' }}
          />
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="btn"
            style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Parents Data Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Parent Accounts ({filteredParents.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '28px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ArrowPathIcon className="w-4 h-4 animate-spin" style={{ color: '#818cf8' }} />
            <span>Loading registered parents...</span>
          </div>
        ) : filteredParents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No registered parent user accounts match the search criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 14px' }}>Parent Profile</th>
                  <th className="hide-mobile" style={{ padding: '10px 14px' }}>Contact Information</th>
                  <th className="hide-mobile" style={{ padding: '10px 14px' }}>Registered Date</th>
                  <th className="hide-mobile" style={{ padding: '10px 14px' }}>Submitted Applications</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredParents.map((parent) => {
                  const pId = parent._id || parent.id;
                  const regDate = parent.createdAt
                    ? new Date(parent.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={pId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{parent.fullName}</span>
                          <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                            PARENT
                          </span>
                        </div>
                        {/* On mobile screens, show email & phone directly under parent name */}
                        <div style={{ marginTop: '4px', fontSize: '12px' }}>
                          <div style={{ color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <EnvelopeIcon className="w-3 h-3 text-slate-400" />
                            <span>{parent.email}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                            <PhoneIcon className="w-3 h-3 text-slate-400" />
                            <span>{parent.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="hide-mobile" style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12.5px' }}>
                          <div style={{ color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{parent.email}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{parent.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="hide-mobile" style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{regDate}</span>
                        </div>
                      </td>

                      <td className="hide-mobile" style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                            {parent.studentsCount || 0} {parent.studentsCount === 1 ? 'application' : 'applications'}
                          </span>
                        </div>
                        {parent.students && parent.students.length > 0 && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {parent.students.map((s) => s.studentName).join(', ')}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setSelectedParent(parent)}
                          className="btn btn-primary"
                          style={{
                            fontSize: '11.5px',
                            padding: '5px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Parent Details Modal */}
      {selectedParent && (
        <div
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
          onClick={() => setSelectedParent(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '680px',
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
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {selectedParent.fullName}
                  </h2>
                  <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    PARENT ACCOUNT
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginTop: '2px', margin: 0 }}>
                  Account ID: <code style={{ color: '#a5b4fc' }}>{selectedParent._id || selectedParent.id}</code>
                </p>
              </div>

              <button
                onClick={() => setSelectedParent(null)}
                className="btn"
                aria-label="Close modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  padding: '5px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Parent Contact Summary Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px', margin: 0 }}>
                Contact & Account Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Email Address</span>
                  <div style={{ color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <EnvelopeIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{selectedParent.email}</span>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Phone Number</span>
                  <div style={{ color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <PhoneIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>{selectedParent.phone}</span>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Registered Date</span>
                  <div style={{ color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {selectedParent.createdAt
                        ? new Date(selectedParent.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitted Applications List */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AcademicCapIcon className="w-4 h-4 text-emerald-400" />
                  Submitted Applications ({selectedParent.studentsCount || 0})
                </h3>
              </div>

              {!selectedParent.students || selectedParent.students.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  No student applications registered under this parent user account.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedParent.students.map((student) => {
                    const sId = student._id || student.id;
                    return (
                      <div
                        key={sId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
                            {student.studentName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ID: <code style={{ color: '#a5b4fc' }}>{sId}</code> • Grade: <strong style={{ color: '#cbd5e1' }}>{student.applyingGrade?.replace('_', ' ')}</strong>
                          </div>
                        </div>

                        <Link
                          href={`/admission/applications?inspect=${sId}`}
                          className="btn btn-primary"
                          onClick={() => setSelectedParent(null)}
                          style={{
                            fontSize: '11.5px',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          View Application <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

