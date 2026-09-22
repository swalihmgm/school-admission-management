'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { examSlotsService } from '@/services/exam-slots.service';
import { ExamSlot } from '@/types';
import {
  CalendarIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { ConfirmModal, AlertModal } from '@/components/ui/confirm-modal';

export default function AdminExamSlotsPage() {
  const [slots, setSlots] = useState<ExamSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    capacity: 10,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingSlot, setEditingSlot] = useState<ExamSlot | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    capacity: 10,
    status: 'ACTIVE' as 'ACTIVE' | 'CANCELLED',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Custom Modal States
  const [confirmModalSlot, setConfirmModalSlot] = useState<ExamSlot | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [alertModalState, setAlertModalState] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    message: '',
  });

  const fetchSlots = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await examSlotsService.getAllSlotsForAdmin();
      setSlots(data);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to retrieve exam slot records.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Create Slot Handler
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createFormData.date || !createFormData.startTime || !createFormData.endTime) {
      setCreateError('Date, start time, and end time are required.');
      return;
    }

    const startDateTime = new Date(`${createFormData.date}T${createFormData.startTime}`);
    const endDateTime = new Date(`${createFormData.date}T${createFormData.endTime}`);

    if (startDateTime >= endDateTime) {
      setCreateError('Start time must be strictly before end time.');
      return;
    }

    if (createFormData.capacity <= 0) {
      setCreateError('Capacity must be a positive integer.');
      return;
    }

    try {
      setCreateLoading(true);
      await examSlotsService.createSlot({
        date: new Date(createFormData.date).toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        capacity: Number(createFormData.capacity),
      });

      setShowCreateModal(false);
      setCreateFormData({ date: '', startTime: '', endTime: '', capacity: 10 });
      await fetchSlots(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to create exam slot.';
      setCreateError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (slot: ExamSlot) => {
    setEditingSlot(slot);
    setEditError(null);

    const d = new Date(slot.date).toISOString().split('T')[0];
    const sTime = new Date(slot.startTime).toTimeString().substring(0, 5);
    const eTime = new Date(slot.endTime).toTimeString().substring(0, 5);

    setEditFormData({
      date: d,
      startTime: sTime,
      endTime: eTime,
      capacity: slot.capacity,
      status: slot.status,
    });
  };

  // Update Slot Handler
  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    setEditError(null);

    const startDateTime = new Date(`${editFormData.date}T${editFormData.startTime}`);
    const endDateTime = new Date(`${editFormData.date}T${editFormData.endTime}`);

    if (startDateTime >= endDateTime) {
      setEditError('Start time must be strictly before end time.');
      return;
    }

    if (editFormData.capacity < editingSlot.bookedCount) {
      setEditError(`Capacity cannot be reduced below current booked count of ${editingSlot.bookedCount}.`);
      return;
    }

    try {
      setEditLoading(true);
      await examSlotsService.updateSlot(editingSlot._id || editingSlot.id!, {
        date: new Date(editFormData.date).toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        capacity: Number(editFormData.capacity),
        status: editFormData.status,
      });

      setEditingSlot(null);
      await fetchSlots(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update exam slot.';
      setEditError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setEditLoading(false);
    }
  };

  // Quick Cancel Slot Handler
  const handleCancelSlot = (slot: ExamSlot) => {
    setConfirmModalSlot(slot);
  };

  const executeCancelSlot = async () => {
    if (!confirmModalSlot) return;
    try {
      setConfirmLoading(true);
      await examSlotsService.updateSlot(confirmModalSlot._id || confirmModalSlot.id!, {
        status: 'CANCELLED',
      });
      setConfirmModalSlot(null);
      await fetchSlots(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel slot.';
      setConfirmModalSlot(null);
      setAlertModalState({
        isOpen: true,
        title: 'Cancellation Failed',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
        variant: 'danger',
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // Metrics
  const totalSlots = slots.length;
  const activeSlots = slots.filter((s) => s.status === 'ACTIVE').length;
  const cancelledSlots = slots.filter((s) => s.status === 'CANCELLED').length;
  const totalBooked = slots.reduce((acc, s) => acc + s.bookedCount, 0);

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
            Exam Slots Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            Create assessment slots, monitor capacity, update schedules, and manage slot cancellations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchSlots(true)}
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
            Refresh
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <PlusIcon className="w-4 h-4" /> Create New Slot
          </button>
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

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Slots
            </span>
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {loading ? '...' : totalSlots}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Slots
            </span>
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#86efac' }}>
            {loading ? '...' : activeSlots}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Cancelled Slots
            </span>
            <XCircleIcon className="w-4 h-4 text-rose-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fca5a5' }}>
            {loading ? '...' : cancelledSlots}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Booked Candidates
            </span>
            <UserGroupIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fcd34d' }}>
            {loading ? '...' : totalBooked}
          </div>
        </div>
      </div>

      {/* Slots Data Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Exam Slots Schedule ({slots.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '28px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ArrowPathIcon className="w-4 h-4 animate-spin" style={{ color: '#818cf8' }} />
            <span>Loading exam slots...</span>
          </div>
        ) : slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No exam slots have been created yet. Click &quot;Create New Slot&quot; to define a slot.
          </div>
        ) : (
          <>
            {/* Mobile View: Clean Exam Slot Cards */}
            <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {slots.map((slot) => {
                const slotId = slot._id || slot.id!;
                const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const startStr = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endStr = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const remaining = Math.max(0, slot.capacity - slot.bookedCount);

                return (
                  <div
                    key={slotId}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14.5px' }}>
                        {dateStr}
                      </span>
                      {slot.status === 'ACTIVE' ? (
                        <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircleIcon className="w-3.5 h-3.5" /> ACTIVE
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircleIcon className="w-3.5 h-3.5" /> CANCELLED
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                        <strong style={{ color: '#e2e8f0' }}>{startStr} – {endStr}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span>Booked / Capacity:</span>
                        <strong style={{ color: '#e2e8f0' }}>{slot.bookedCount} / {slot.capacity}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Remaining Seats:</span>
                        <span style={{ color: remaining > 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                          {remaining} {remaining === 1 ? 'seat' : 'seats'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <button
                        onClick={() => openEditModal(slot)}
                        className="btn"
                        style={{
                          padding: '5px 12px',
                          fontSize: '12px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#a5b4fc',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                      {slot.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCancelSlot(slot)}
                          className="btn"
                          style={{
                            padding: '5px 12px',
                            fontSize: '12px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <XCircleIcon className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
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
                    <th style={{ padding: '10px 14px' }}>Date</th>
                    <th style={{ padding: '10px 14px' }}>Time Range</th>
                    <th style={{ padding: '10px 14px' }}>Capacity / Booked</th>
                    <th style={{ padding: '10px 14px' }}>Remaining Seats</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => {
                    const slotId = slot._id || slot.id!;
                    const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    const startStr = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const endStr = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const remaining = Math.max(0, slot.capacity - slot.bookedCount);

                    return (
                      <tr key={slotId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>
                          {dateStr}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{startStr} – {endStr}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600 }}>
                          {slot.bookedCount} / {slot.capacity}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ color: remaining > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                            {remaining} {remaining === 1 ? 'seat' : 'seats'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {slot.status === 'ACTIVE' ? (
                            <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircleIcon className="w-3.5 h-3.5" /> ACTIVE
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircleIcon className="w-3.5 h-3.5" /> CANCELLED
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openEditModal(slot)}
                              className="btn"
                              style={{
                                padding: '4px 8px',
                                fontSize: '11.5px',
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#a5b4fc',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                            </button>
                            {slot.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleCancelSlot(slot)}
                                className="btn"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11.5px',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#fca5a5',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <XCircleIcon className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}
                          </div>
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

      {/* Create New Slot Modal */}
      {showCreateModal && (
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
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Create Entrance Exam Slot
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn"
                style={{ padding: '5px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc' }}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Slot Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={createFormData.date}
                  onChange={(e) => setCreateFormData({ ...createFormData, date: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={createFormData.startTime}
                    onChange={(e) => setCreateFormData({ ...createFormData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={createFormData.endTime}
                    onChange={(e) => setCreateFormData({ ...createFormData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Seat Capacity *</label>
                <input
                  type="number"
                  min={1}
                  required
                  className="form-input"
                  value={createFormData.capacity}
                  onChange={(e) => setCreateFormData({ ...createFormData, capacity: Number(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating Slot...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
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
          }}
          onClick={() => setEditingSlot(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PencilSquareIcon className="w-5 h-5 text-indigo-400" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Edit Exam Slot
                </h3>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                className="btn"
                style={{ padding: '5px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc' }}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Slot Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Seat Capacity (Current Booked: {editingSlot.bookedCount}) *</label>
                <input
                  type="number"
                  min={editingSlot.bookedCount}
                  required
                  className="form-input"
                  value={editFormData.capacity}
                  onChange={(e) => setEditFormData({ ...editFormData, capacity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label">Status *</label>
                <select
                  className="form-input"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="btn"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Slot Cancellation */}
      <ConfirmModal
        isOpen={Boolean(confirmModalSlot)}
        title="Cancel Exam Slot"
        message={
          confirmModalSlot ? (
            <span>
              Are you sure you want to cancel the exam slot scheduled on{' '}
              <strong style={{ color: '#f8fafc' }}>
                {new Date(confirmModalSlot.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </strong>{' '}
              ({new Date(confirmModalSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(confirmModalSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})?
              {confirmModalSlot.bookedCount > 0 && (
                <div style={{ marginTop: '10px', color: '#fbbf24', fontWeight: 600 }}>
                  Warning: {confirmModalSlot.bookedCount} student(s) are currently booked in this slot.
                </div>
              )}
            </span>
          ) : (
            ''
          )
        }
        confirmText="Yes, Cancel Slot"
        cancelText="Keep Active"
        variant="danger"
        isLoading={confirmLoading}
        onConfirm={executeCancelSlot}
        onCancel={() => setConfirmModalSlot(null)}
      />

      {/* Custom Alert Modal for Errors / Info */}
      <AlertModal
        isOpen={alertModalState.isOpen}
        title={alertModalState.title}
        message={alertModalState.message}
        variant={alertModalState.variant}
        onClose={() => setAlertModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
