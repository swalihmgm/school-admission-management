'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { studentsService } from '@/services/students.service';
import { Gender, Grade, CreateStudentDto } from '@/types';
import { InformationCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewStudentApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateStudentDto>({
    studentName: '',
    dateOfBirth: '',
    gender: Gender.MALE,
    previousSchool: '',
    applyingGrade: Grade.GRADE_1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side basic validation
    if (!formData.studentName.trim()) {
      setError('Student name is required.');
      return;
    }
    if (!formData.dateOfBirth) {
      setError('Date of birth is required.');
      return;
    }
    if (!formData.previousSchool.trim()) {
      setError('Previous school is required.');
      return;
    }

    try {
      setLoading(true);
      const createdStudent = await studentsService.createStudent({
        studentName: formData.studentName.trim(),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        gender: formData.gender,
        previousSchool: formData.previousSchool.trim(),
        applyingGrade: formData.applyingGrade,
      });

      const newId = createdStudent._id || createdStudent.id;
      if (newId) {
        router.push(`/parent/students/${newId}`);
      } else {
        router.push('/parent/students');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to create student application. Please check inputs and try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          href="/parent/students"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Applications
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
          New Student Application
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
          Fill out your child&apos;s personal and academic details to begin the admission process.
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" htmlFor="studentName">
              Student Full Name *
            </label>
            <input
              id="studentName"
              name="studentName"
              type="text"
              className="form-input"
              placeholder="e.g. Rahul Sharma"
              value={formData.studentName}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label" htmlFor="dateOfBirth">
                Date of Birth *
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className="form-input"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor="gender">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                className="form-input"
                value={formData.gender}
                onChange={handleChange}
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
            <label className="form-label" htmlFor="previousSchool">
              Previous School Name *
            </label>
            <input
              id="previousSchool"
              name="previousSchool"
              type="text"
              className="form-input"
              placeholder="e.g. St. Xavier's Primary School"
              value={formData.previousSchool}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="applyingGrade">
              Applying Grade *
            </label>
            <select
              id="applyingGrade"
              name="applyingGrade"
              className="form-input"
              value={formData.applyingGrade}
              onChange={handleChange}
              required
              style={{ background: 'rgba(15, 23, 42, 0.8)' }}
            >
              <option value={Grade.GRADE_1}>Grade 1</option>
              <option value={Grade.GRADE_2}>Grade 2</option>
              <option value={Grade.GRADE_3}>Grade 3</option>
              <option value={Grade.GRADE_4}>Grade 4</option>
            </select>
          </div>

          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              fontSize: '12.5px',
              color: '#c7d2fe',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <InformationCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} />
            <span>
              Initial status will be <strong>APPLICATION_CREATED</strong> and <strong>UNPAID</strong>. Details remain editable until fee payment.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Link
              href="/parent/students"
              className="btn"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#cbd5e1',
                textDecoration: 'none',
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '150px' }}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
