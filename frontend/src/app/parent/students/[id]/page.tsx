'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { studentsService } from '@/services/students.service';
import { paymentsService } from '@/services/payments.service';
import { examSlotsService } from '@/services/exam-slots.service';
import { loadRazorpayScript } from '@/lib/razorpay-loader';
import {
  Student,
  Gender,
  Grade,
  PaymentStatus,
  ApplicationStatus,
  ExamAttendance,
  UserRole,
  UpdateStudentDto,
  RazorpayOptions,
  RazorpayResponse,
  ExamSlot,
  CreatePaymentOrderResponse,
} from '@/types';
import { AdmissionTimeline } from '@/components/admission-timeline';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [formData, setFormData] = useState<UpdateStudentDto>({
    studentName: '',
    dateOfBirth: '',
    gender: Gender.MALE,
    previousSchool: '',
    applyingGrade: Grade.GRADE_1,
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Payment state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // Test Mode Payment Simulator State
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<CreatePaymentOrderResponse | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  // Exam Slot state
  const [availableSlots, setAvailableSlots] = useState<ExamSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [bookedSlot, setBookedSlot] = useState<ExamSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState<string | null>(null);

  const fetchStudentData = async (isMounted = true, manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await studentsService.getStudentById(studentId);
      if (isMounted) {
        setStudent(data);

        // Check if student already has a populated examSlotId object
        if (data.examSlotId && typeof data.examSlotId === 'object') {
          setBookedSlot(data.examSlotId as ExamSlot);
        }

        // Populate edit form defaults
        const formattedDob = data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().split('T')[0]
          : '';
        setFormData({
          studentName: data.studentName,
          dateOfBirth: formattedDob,
          gender: data.gender,
          previousSchool: data.previousSchool,
          applyingGrade: data.applyingGrade,
        });
      }
    } catch (err: any) {
      if (isMounted) {
        const status = err.response?.status;
        if (status === 403) {
          setError('Access Denied: You are not authorized to view this student application.');
        } else if (status === 404) {
          setError('Student Application Not Found: The requested application does not exist.');
        } else {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to load student details.';
          setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
      }
    } finally {
      if (isMounted) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setSlotsLoading(true);
      const slots = await examSlotsService.getAvailableSlots();
      setAvailableSlots(slots);

      if (student?.examSlotId && typeof student.examSlotId === 'string') {
        const match = slots.find((s) => (s._id || s.id) === student.examSlotId);
        if (match) {
          setBookedSlot(match);
        }
      }
    } catch (err: any) {
      console.error('Failed to load available exam slots', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (studentId) {
      fetchStudentData(isMounted);
    }
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  useEffect(() => {
    if (student?.paymentStatus === PaymentStatus.PAID && user?.role === UserRole.PARENT) {
      fetchAvailableSlots();
    }
  }, [student?.paymentStatus, student?.examSlotId, user?.role]);

  const isEditable =
    student?.paymentStatus === PaymentStatus.UNPAID &&
    student?.applicationStatus === ApplicationStatus.APPLICATION_CREATED;

  const isPayable =
    user?.role === UserRole.PARENT &&
    student?.paymentStatus === PaymentStatus.UNPAID &&
    student?.applicationStatus === ApplicationStatus.APPLICATION_CREATED;

  const isSlotBookingAllowed =
    user?.role === UserRole.PARENT &&
    student?.paymentStatus === PaymentStatus.PAID &&
    student?.applicationStatus !== ApplicationStatus.EXAM_COMPLETED &&
    student?.applicationStatus !== ApplicationStatus.ADMISSION_COMPLETED;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);

    if (!formData.studentName?.trim()) {
      setUpdateError('Student name is required.');
      return;
    }
    if (!formData.dateOfBirth) {
      setUpdateError('Date of birth is required.');
      return;
    }
    if (!formData.previousSchool?.trim()) {
      setUpdateError('Previous school is required.');
      return;
    }

    try {
      setUpdating(true);
      const updated = await studentsService.updateStudent(studentId, {
        studentName: formData.studentName.trim(),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        gender: formData.gender,
        previousSchool: formData.previousSchool?.trim(),
        applyingGrade: formData.applyingGrade,
      });

      setStudent(updated);
      setUpdateSuccess('Student application updated successfully.');
      setIsEditing(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update student details.';
      setUpdateError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setUpdating(false);
    }
  };

  const handlePayment = async () => {
    if (paymentLoading || !student) return;
    setPaymentError(null);
    setPaymentSuccessMessage(null);
    setPaymentLoading(true);

    try {
      const order = await paymentsService.createOrder(studentId);
      const isDummyMode =
        order.keyId.includes('dummy') || order.orderId.startsWith('order_mock_');

      if (isDummyMode) {
        setPendingOrder(order);
        setShowSimulatorModal(true);
      } else {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          setPaymentError(
            'Failed to load Razorpay Checkout SDK. Please check your internet connection and try again.'
          );
          setPaymentLoading(false);
          return;
        }

        const options: RazorpayOptions = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'School Admission Management System',
          description: `Registration Fee for ${student.studentName}`,
          order_id: order.orderId,
          prefill: {
            name: user?.fullName,
            email: user?.email,
            contact: user?.phone,
          },
          theme: {
            color: '#6366f1',
          },
          modal: {
            ondismiss: () => {
              setPaymentLoading(false);
              setPaymentError('Payment checkout was closed or cancelled by the user.');
            },
          },
          handler: async (response: RazorpayResponse) => {
            try {
              setPaymentLoading(true);
              setPaymentError(null);

              await paymentsService.verifyPayment({
                studentId,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });

              await fetchStudentData(true);
              setPaymentSuccessMessage(
                'Registration fee of INR 500 verified successfully. Application status is now Registration Fee Paid.'
              );
            } catch (err: any) {
              const msg =
                err.response?.data?.message ||
                err.message ||
                'Payment verification failed. Please try again.';
              setPaymentError(Array.isArray(msg) ? msg.join(', ') : msg);
            } finally {
              setPaymentLoading(false);
            }
          },
        };

        const rzp = new window.Razorpay!(options);
        rzp.open();
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to initialize payment order. Please try again.';
      setPaymentError(Array.isArray(msg) ? msg.join(', ') : msg);
      setPaymentLoading(false);
    }
  };

  const handleConfirmSimulatedPayment = async () => {
    if (!pendingOrder || simulatingPayment) return;
    setSimulatingPayment(true);
    setPaymentError(null);

    try {
      const paymentId = `pay_simulated_${Date.now()}`;
      await paymentsService.verifyPayment({
        studentId,
        orderId: pendingOrder.orderId,
        paymentId,
        signature: 'simulated_test_signature',
      });

      await fetchStudentData(true);
      setPaymentSuccessMessage(
        'Registration fee of INR 500 verified successfully via Test Mode Simulator. Application status updated to Registration Fee Paid.'
      );
      setShowSimulatorModal(false);
      setPendingOrder(null);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Test Mode payment verification failed.';
      setPaymentError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSimulatingPayment(false);
      setPaymentLoading(false);
    }
  };

  const handleCancelSimulatedPayment = () => {
    setShowSimulatorModal(false);
    setPendingOrder(null);
    setPaymentLoading(false);
    setPaymentError('Payment was cancelled by the user in Test Mode Simulator.');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSimulatorModal) {
        handleCancelSimulatedPayment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSimulatorModal]);

  const handleBookSlot = async () => {
    if (!selectedSlotId || bookingLoading || !student) return;
    setBookingError(null);
    setBookingSuccessMessage(null);
    setBookingLoading(true);

    try {
      const res = await examSlotsService.bookOrRescheduleSlot(studentId, selectedSlotId);
      
      setStudent(res.student);
      setBookedSlot(res.slot);
      setBookingSuccessMessage(res.message);
      setSelectedSlotId('');

      await fetchAvailableSlots();
      await fetchStudentData(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to book exam slot. Please try another slot.';
      setBookingError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <ArrowPathIcon className="w-5 h-5 animate-spin" style={{ color: '#818cf8' }} />
          <span>Loading student application details...</span>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link href="/parent/students" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeftIcon className="w-4 h-4" /> Back to Applications
        </Link>
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <ExclamationTriangleIcon className="w-8 h-8" style={{ color: '#f87171', margin: '0 auto 10px auto' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
            Application Access Issue
          </h2>
          <p style={{ color: '#fca5a5', fontSize: '13.5px', marginBottom: '20px' }}>
            {error || 'Student application not found.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => fetchStudentData(true, true)}
              className="btn"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowPathIcon className="w-4 h-4" /> Try Again
            </button>
            <Link href="/parent/students" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Return to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedDob = new Date(student.dateOfBirth).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isCurrentSlotPast = bookedSlot
    ? new Date() >= new Date(bookedSlot.startTime)
    : false;

  const examRecordedDateStr = student.examResultRecordedAt
    ? new Date(student.examResultRecordedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <Link href="/parent/students" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeftIcon className="w-4 h-4" /> Back to Applications
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchStudentData(true, true)}
            disabled={isRefreshing}
            className="btn"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#a5b4fc',
              fontSize: '12px',
              padding: '5px 11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      {/* Compact Header & Application Progress Timeline Card */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 className="gradient-text" style={{ fontSize: '22px', fontWeight: 800, margin: 0, wordBreak: 'break-word' }}>
                {student.studentName}
              </h1>
              <span style={{ fontSize: '11.5px', color: '#a5b4fc', fontWeight: 600, background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 8px', borderRadius: '6px', wordBreak: 'break-all' }}>
                ID: {student._id || student.id}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', margin: 0 }}>
              Track real-time admission workflow progress and required next actions for this application.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '12px',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <InformationCircleIcon className="w-3.5 h-3.5" />
              {showFullDetails ? 'Hide Student Profile Details' : 'View Student Profile Details'}
            </button>

            {isEditable && !isEditing && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowFullDetails(true);
                }}
                className="btn"
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <PencilSquareIcon className="w-3.5 h-3.5" /> Edit Details
              </button>
            )}
          </div>
        </div>

        {/* Timeline OR Admission Completed Card */}
        <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {student.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED ? (
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                  <AcademicCapIcon className="w-8 h-8" style={{ color: '#4ade80' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    Admission Completed
                  </h2>
                  <p style={{ color: '#86efac', fontSize: '13.5px', marginTop: '4px', margin: 0 }}>
                    Congratulations! The admission process for <strong>{student.studentName}</strong> has been finalized by the Admission Team.
                  </p>
                </div>
              </div>

              {student.assignedGrade && (
                <div
                  style={{
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#d8b4fe', textTransform: 'uppercase', fontWeight: 700 }}>
                    Assigned Grade:
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#f3e8ff' }}>
                    {student.assignedGrade.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <AdmissionTimeline student={student} bookedSlot={bookedSlot} />
          )}
        </div>

        {/* Optional Collapsible Student Profile Details */}
        {showFullDetails && (
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {isEditable && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  color: '#fef08a',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                <LockClosedIcon className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <div>
                  <strong>Notice:</strong> Application details can be modified now, but will become locked after registration fee payment.
                </div>
              </div>
            )}
            {isEditing ? (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label" htmlFor="edit-studentName">
                    Student Full Name *
                  </label>
                  <input
                    id="edit-studentName"
                    name="studentName"
                    type="text"
                    className="form-input"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="form-label" htmlFor="edit-dateOfBirth">
                      Date of Birth *
                    </label>
                    <input
                      id="edit-dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      className="form-input"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="edit-gender">
                      Gender *
                    </label>
                    <select
                      id="edit-gender"
                      name="gender"
                      className="form-input"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      style={{ background: 'rgba(15, 23, 42, 0.8)' }}
                    >
                      <option value={Gender.MALE}>MALE</option>
                      <option value={Gender.FEMALE}>FEMALE</option>
                      <option value={Gender.OTHER}>OTHER</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="edit-previousSchool">
                    Previous School Name *
                  </label>
                  <input
                    id="edit-previousSchool"
                    name="previousSchool"
                    type="text"
                    className="form-input"
                    value={formData.previousSchool}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="edit-applyingGrade">
                    Applying Grade *
                  </label>
                  <select
                    id="edit-applyingGrade"
                    name="applyingGrade"
                    className="form-input"
                    value={formData.applyingGrade}
                    onChange={handleInputChange}
                    required
                    style={{ background: 'rgba(15, 23, 42, 0.8)' }}
                  >
                    <option value={Grade.GRADE_1}>Grade 1</option>
                    <option value={Grade.GRADE_2}>Grade 2</option>
                    <option value={Grade.GRADE_3}>Grade 3</option>
                    <option value={Grade.GRADE_4}>Grade 4</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setUpdateError(null);
                    }}
                    className="btn"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#cbd5e1',
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>
                    Applying Grade
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                    {student.applyingGrade.replace('_', ' ')}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>
                    Date of Birth
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                    {formattedDob}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>
                    Gender
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                    {student.gender}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>
                    Previous School
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                    {student.previousSchool}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Success & Error Banners */}
      {updateSuccess && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#86efac',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{updateSuccess}</span>
        </div>
      )}

      {updateError && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{updateError}</span>
        </div>
      )}

      {paymentSuccessMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#86efac',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{paymentSuccessMessage}</span>
        </div>
      )}

      {paymentError && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '8px',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}


      {/* Registration Fee Payment Section (Shown ONLY when UNPAID) */}
      {student.paymentStatus !== PaymentStatus.PAID && (
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: '#f8fafc' }}>
            Registration Fee Payment
          </h2>

          {isPayable ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
                To proceed with the entrance exam scheduling, please complete the registration fee payment.
              </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>
                  Fee Amount
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
                  INR 500.00
                </div>
                <div style={{ fontSize: '11.5px', color: '#818cf8', marginTop: '2px' }}>
                  Secure payment via Razorpay
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CreditCardIcon className="w-4 h-4" />
                {paymentLoading ? 'Processing Payment...' : 'Pay Registration Fee (INR 500)'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
            Registration fee payment is not active for this stage.
          </p>
        )}
      </div>
      )}

      {/* Razorpay Test Mode Simulator Modal (Dev / Mock Credentials Only) */}
      {showSimulatorModal && pendingOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
          onClick={handleCancelSimulatedPayment}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              position: 'relative',
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCardIcon className="w-5 h-5 text-indigo-400" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Razorpay Test Mode Simulator
                </h3>
              </div>
              <button
                onClick={handleCancelSimulatedPayment}
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  padding: '5px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Simulate payment for <strong>{student?.studentName}</strong> in development test mode.
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                <code style={{ color: '#a5b4fc' }}>{pendingOrder.orderId}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700 }}>
                <span style={{ color: '#f8fafc' }}>Amount:</span>
                <span style={{ color: '#4ade80' }}>INR 500.00</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleConfirmSimulatedPayment}
                disabled={simulatingPayment}
                className="btn btn-primary"
                style={{ padding: '10px', fontSize: '13.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <CreditCardIcon className="w-4 h-4" />
                {simulatingPayment ? 'Verifying Payment...' : 'Complete Test Payment (INR 500)'}
              </button>
              <button
                onClick={handleCancelSimulatedPayment}
                disabled={simulatingPayment}
                className="btn"
                style={{
                  padding: '8px',
                  fontSize: '12.5px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#cbd5e1',
                  textAlign: 'center',
                }}
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Slot Booking & Rescheduling Section */}
      {isSlotBookingAllowed && (
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <CalendarIcon className="w-5 h-5" style={{ color: '#818cf8' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Entrance Exam Slot Booking
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '16px' }}>
            Select an active slot for your child&apos;s entrance assessment. You can reschedule before the exam start time.
          </p>

          {bookingSuccessMessage && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#86efac',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{bookingSuccessMessage}</span>
            </div>
          )}

          {bookingError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
              <span><strong>Booking Error:</strong> {bookingError}</span>
            </div>
          )}

          {/* Currently Booked Slot Card */}
          {bookedSlot && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon className="w-4 h-4" style={{ color: '#a5b4fc' }} />
                  <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#c7d2fe', margin: 0 }}>
                    Currently Booked Exam Slot
                  </h3>
                </div>
                <span
                  style={{
                    background: 'rgba(99, 102, 241, 0.25)',
                    color: '#a5b4fc',
                    padding: '3px 10px',
                    borderRadius: '14px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                  }}
                >
                  Slot Booked
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Date</span>
                  <strong style={{ color: '#f8fafc' }}>
                    {new Date(bookedSlot.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>Start Time</span>
                  <strong style={{ color: '#f8fafc' }}>
                    {new Date(bookedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: 600 }}>End Time</span>
                  <strong style={{ color: '#f8fafc' }}>
                    {new Date(bookedSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>
              </div>

              {isCurrentSlotPast ? (
                <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>The scheduled start time for this slot has passed. Rescheduling is no longer available.</span>
                </div>
              ) : (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Select an available replacement slot below if you wish to reschedule.</span>
                </div>
              )}
            </div>
          )}

          {/* Available Slots List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '14.5px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              {bookedSlot ? 'Select Replacement Exam Slot' : 'Available Exam Slots'}
            </h4>

            {slotsLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Loading available exam slots...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                No open exam slots are currently available for booking. Please check back later.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {availableSlots.map((slot) => {
                  const slotId = slot._id || slot.id || '';
                  const isCurrent = bookedSlot && (bookedSlot._id || bookedSlot.id) === slotId;
                  const isSelected = selectedSlotId === slotId;
                  const remainingCapacity = Math.max(0, slot.capacity - slot.bookedCount);

                  const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  const startStr = new Date(slot.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const endStr = new Date(slot.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={slotId}
                      onClick={() => {
                        if (!isCurrent && !isCurrentSlotPast && slotId) {
                          setSelectedSlotId(slotId);
                        }
                      }}
                      style={{
                        background: isCurrent
                          ? 'rgba(99, 102, 241, 0.08)'
                          : isSelected
                          ? 'rgba(99, 102, 241, 0.2)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '2px solid #818cf8'
                          : isCurrent
                          ? '1px dashed #818cf8'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '14px',
                        cursor: isCurrent || isCurrentSlotPast ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#f8fafc' }}>{dateStr}</span>
                        {isCurrent ? (
                          <span style={{ fontSize: '10.5px', background: 'rgba(99,102,241,0.3)', color: '#c7d2fe', padding: '2px 6px', borderRadius: '4px' }}>
                            Currently Booked
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#4ade80', fontWeight: 600 }}>
                            {remainingCapacity} seats left
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{startStr} - {endStr}</span>
                      </div>

                      {!isCurrent && (
                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="radio"
                            name="selectedSlot"
                            checked={isSelected}
                            onChange={() => {
                              if (slotId) setSelectedSlotId(slotId);
                            }}
                            disabled={isCurrentSlotPast}
                          />
                          <span style={{ fontSize: '11.5px', color: isSelected ? '#a5b4fc' : 'var(--text-muted)' }}>
                            {isSelected ? 'Selected' : 'Click to select'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {availableSlots.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  onClick={handleBookSlot}
                  disabled={!selectedSlotId || bookingLoading || isCurrentSlotPast}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 20px',
                    fontSize: '13.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {bookingLoading
                    ? 'Processing Request...'
                    : bookedSlot
                    ? 'Reschedule to Selected Slot'
                    : 'Confirm & Book Exam Slot'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authoritative Exam Result Display Section (Read-Only) */}
      {(student.examAttendance || student.applicationStatus === ApplicationStatus.EXAM_COMPLETED || student.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED) && (
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AcademicCapIcon className="w-5 h-5" style={{ color: '#38bdf8' }} />
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Entrance Exam Evaluation
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', margin: 0 }}>
                  Authoritative result recorded by the Admission Team (Read-Only)
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <LockClosedIcon className="w-3.5 h-3.5" /> Read-Only
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Exam Attendance Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                Attendance Status
              </div>
              {student.examAttendance === ExamAttendance.PRESENT ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: 700, fontSize: '16px' }}>
                  <CheckCircleIcon className="w-5 h-5" /> PRESENT
                </div>
              ) : student.examAttendance === ExamAttendance.ABSENT ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 700, fontSize: '16px' }}>
                  <XCircleIcon className="w-5 h-5" /> ABSENT
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
                  Pending Evaluation
                </div>
              )}
            </div>

            {/* Exam Marks / ABSENT Notice Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                Test Marks
              </div>
              {student.examAttendance === ExamAttendance.PRESENT ? (
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>
                  {student.examMarks !== null && student.examMarks !== undefined ? `${student.examMarks} / 100` : 'Score Pending'}
                </div>
              ) : student.examAttendance === ExamAttendance.ABSENT ? (
                <div>
                  <div style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
                    No Marks (Candidate Was Absent)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Marks are not applicable for absent candidates.
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  Awaiting test grading
                </div>
              )}
            </div>

            {/* Evaluation Timestamp Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                Result Recorded At
              </div>
              {examRecordedDateStr ? (
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{examRecordedDateStr}</span>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  Timestamp unavailable
                </div>
              )}
            </div>
          </div>

          {/* ABSENT Notice Box */}
          {student.examAttendance === ExamAttendance.ABSENT && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <XCircleIcon className="w-4 h-4 flex-shrink-0" />
              <div>
                <strong>Notice:</strong> The candidate was absent during the scheduled entrance examination slot. No marks are rendered to prevent misleading test score representation.
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

