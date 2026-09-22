'use client';

import React from 'react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <XCircleIcon className="w-6 h-6" style={{ color: '#f87171' }} />,
      iconBg: 'rgba(239, 68, 68, 0.15)',
      iconBorder: 'rgba(239, 68, 68, 0.3)',
      confirmBtnBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      confirmBtnShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
      cardBorder: 'rgba(239, 68, 68, 0.35)',
    },
    warning: {
      icon: <ExclamationTriangleIcon className="w-6 h-6" style={{ color: '#fbbf24' }} />,
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconBorder: 'rgba(245, 158, 11, 0.3)',
      confirmBtnBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      confirmBtnShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
      cardBorder: 'rgba(245, 158, 11, 0.35)',
    },
    info: {
      icon: <InformationCircleIcon className="w-6 h-6" style={{ color: '#818cf8' }} />,
      iconBg: 'rgba(99, 102, 241, 0.15)',
      iconBorder: 'rgba(99, 102, 241, 0.3)',
      confirmBtnBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      confirmBtnShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
      cardBorder: 'rgba(99, 102, 241, 0.35)',
    },
    success: {
      icon: <CheckCircleIcon className="w-6 h-6" style={{ color: '#4ade80' }} />,
      iconBg: 'rgba(34, 197, 94, 0.15)',
      iconBorder: 'rgba(34, 197, 94, 0.3)',
      confirmBtnBg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      confirmBtnShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
      cardBorder: 'rgba(34, 197, 94, 0.35)',
    },
  }[variant];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onCancel}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#0f172a',
          border: `1px solid ${variantStyles.cardBorder}`,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(99, 102, 241, 0.15)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: variantStyles.iconBg,
                border: `1px solid ${variantStyles.iconBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {variantStyles.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '24px' }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '9px 18px',
              fontSize: '13px',
              borderRadius: '10px',
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="btn"
            style={{
              background: variantStyles.confirmBtnBg,
              color: '#ffffff',
              boxShadow: variantStyles.confirmBtnShadow,
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '10px',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  buttonText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onClose: () => void;
}

export function AlertModal({
  isOpen,
  title = 'Notification',
  message,
  buttonText = 'OK',
  variant = 'info',
  onClose,
}: AlertModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <XCircleIcon className="w-6 h-6" style={{ color: '#f87171' }} />,
      iconBg: 'rgba(239, 68, 68, 0.15)',
      iconBorder: 'rgba(239, 68, 68, 0.3)',
      btnBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      cardBorder: 'rgba(239, 68, 68, 0.35)',
    },
    warning: {
      icon: <ExclamationTriangleIcon className="w-6 h-6" style={{ color: '#fbbf24' }} />,
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconBorder: 'rgba(245, 158, 11, 0.3)',
      btnBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      cardBorder: 'rgba(245, 158, 11, 0.35)',
    },
    info: {
      icon: <InformationCircleIcon className="w-6 h-6" style={{ color: '#818cf8' }} />,
      iconBg: 'rgba(99, 102, 241, 0.15)',
      iconBorder: 'rgba(99, 102, 241, 0.3)',
      btnBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      cardBorder: 'rgba(99, 102, 241, 0.35)',
    },
    success: {
      icon: <CheckCircleIcon className="w-6 h-6" style={{ color: '#4ade80' }} />,
      iconBg: 'rgba(34, 197, 94, 0.15)',
      iconBorder: 'rgba(34, 197, 94, 0.3)',
      btnBg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      cardBorder: 'rgba(34, 197, 94, 0.35)',
    },
  }[variant];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#0f172a',
          border: `1px solid ${variantStyles.cardBorder}`,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: variantStyles.iconBg,
              border: `1px solid ${variantStyles.iconBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {variantStyles.icon}
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              {title}
            </h3>
          </div>
        </div>

        <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '24px' }}>
          {message}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn"
            style={{
              background: variantStyles.btnBg,
              color: '#ffffff',
              padding: '9px 24px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
