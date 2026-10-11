'use client';

import { useState } from 'react';
import {
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import InputField from '@/components/shared/InputField';
import PrimaryButton from '@/components/shared/PrimaryButton';
import AlertMessage from '@/components/shared/AlertMessage';
import { parseRegisteredFarmers } from '@/lib/registered-farmers';

interface ForgotPasswordFlowProps {
  initialIdentifier?: string;
  onSuccess: (updatedIdentifier: string) => void;
  onCancel: () => void;
}

export default function ForgotPasswordFlow({
  initialIdentifier = '',
  onSuccess,
  onCancel,
}: ForgotPasswordFlowProps) {
  const { language } = useLanguage();

  const [step, setStep] = useState<'identify' | 'reset' | 'completed'>('identify');
  const [identifier, setIdentifier] = useState(initialIdentifier.trim());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [errors, setErrors] = useState<{
    identifier?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateIdentifier = (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.includes('@')) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    }
    const digitsOnly = trimmed.replace(/\D/g, '');
    return digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91'));
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * STEP 1: IDENTIFY USER (Mobile number or Email)
   * ───────────────────────────────────────────────────────────────────────── */
  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!identifier.trim()) {
      newErrors.identifier = t('validation.required.mobile', language);
    } else if (!validateIdentifier(identifier)) {
      newErrors.identifier = t('validation.invalid.mobile', language);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep('reset');
    setAlert(null);
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * STEP 2: RESET PASSWORD
   * ───────────────────────────────────────────────────────────────────────── */
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.newPassword = t('forgot.newPassword', language);
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t('forgot.passwordTooShort', language);
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('forgot.confirmPassword', language);
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('forgot.passwordMismatch', language);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      if (typeof window !== 'undefined') {
        const isEmail = identifier.includes('@');
        const cleanEmail = identifier.trim().toLowerCase();
        const digits = identifier.trim().replace(/\D/g, '');
        const tenDigits = digits.slice(-10);
        const formattedPhone = '+91' + tenDigits;

        if (isEmail) {
          localStorage.setItem(`km_pw_${cleanEmail}`, newPassword);
          localStorage.setItem(`km_reg_${cleanEmail}`, JSON.stringify({ fullName: 'Farmer', password: newPassword, email: cleanEmail }));
        } else {
          localStorage.setItem(`km_pw_${tenDigits}`, newPassword);
          localStorage.setItem(`km_pw_${formattedPhone}`, newPassword);
          localStorage.setItem(`km_pw_${identifier.trim()}`, newPassword);
          localStorage.setItem(`km_reg_${tenDigits}`, JSON.stringify({ fullName: 'Farmer', password: newPassword, phone: formattedPhone }));
          localStorage.setItem(`km_reg_${formattedPhone}`, JSON.stringify({ fullName: 'Farmer', password: newPassword, phone: formattedPhone }));
        }

        // Update entry in km_registered_farmers list
        const list = parseRegisteredFarmers(localStorage.getItem('km_registered_farmers'));
        const existingIdx = list.findIndex((u) =>
          isEmail
            ? u.email === cleanEmail || u.identifier === cleanEmail
            : u.phone?.replace(/\D/g, '').slice(-10) === tenDigits || u.identifier === tenDigits
        );
        if (existingIdx >= 0) {
          list[existingIdx].password = newPassword;
        } else {
          list.push({
            fullName: 'Farmer',
            password: newPassword,
            identifier: isEmail ? cleanEmail : tenDigits,
            phone: isEmail ? undefined : formattedPhone,
            email: isEmail ? cleanEmail : undefined,
            updatedAt: new Date().toISOString(),
          });
        }
        localStorage.setItem('km_registered_farmers', JSON.stringify(list));
      }

      setStep('completed');
      setAlert({
        type: 'success',
        message: t('forgot.passwordSuccess', language),
      });

      setTimeout(() => {
        onSuccess(identifier.trim());
      }, 1500);
    } catch {
      setAlert({ type: 'error', message: t('error.generic', language) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header & Back Link */}
      <div className="flex items-center justify-between border-b border-primary-100 pb-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors py-1 px-2 rounded-lg hover:bg-primary-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          {t('forgot.backToLogin', language)}
        </button>

        {step !== 'completed' && (
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200">
            {step === 'identify' ? `${t('register.step', language)} 1 / 2` : `${t('register.step', language)} 2 / 2`}
          </span>
        )}
      </div>

      {/* Notification Alert Banner */}
      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
      )}

      {/* ── STEP 1: IDENTIFY USER ── */}
      {step === 'identify' && (
        <form onSubmit={handleIdentify} noValidate className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-primary-950">
              {t('forgot.title', language)}
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
              {t('forgot.subtitle', language)}
            </p>
          </div>

          <InputField
            id="forgot-identifier"
            label={t('forgot.identifierLabel', language)}
            type="text"
            placeholder={t('forgot.identifierPlaceholder', language)}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setErrors((prev) => ({ ...prev, identifier: undefined }));
            }}
            error={errors.identifier}
            icon={<Smartphone className="w-4 h-4" />}
            required
            autoComplete="username"
          />

          <PrimaryButton type="submit" fullWidth size="lg">
            {t('register.next', language)}
          </PrimaryButton>
        </form>
      )}

      {/* ── STEP 2: SET NEW PASSWORD ── */}
      {step === 'reset' && (
        <form onSubmit={handleResetPassword} noValidate className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-primary-950">
              {t('forgot.newPassword', language)}
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
              {identifier}
            </p>
          </div>

          <InputField
            id="reset-new-password"
            label={t('forgot.newPassword', language)}
            type={showNewPassword ? 'text' : 'password'}
            placeholder={t('forgot.newPasswordPlaceholder', language)}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setErrors((prev) => ({ ...prev, newPassword: undefined }));
            }}
            error={errors.newPassword}
            icon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="text-gray-400 hover:text-primary-700 p-1 focus:outline-none"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <InputField
            id="reset-confirm-password"
            label={t('forgot.confirmPassword', language)}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('forgot.confirmPasswordPlaceholder', language)}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            error={errors.confirmPassword}
            icon={<ShieldCheck className="w-4 h-4" />}
            required
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-gray-400 hover:text-primary-700 p-1 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <PrimaryButton type="submit" fullWidth loading={loading} size="lg">
            {t('forgot.updatePasswordBtn', language)}
          </PrimaryButton>
        </form>
      )}

      {/* ── STEP 3: COMPLETED ── */}
      {step === 'completed' && (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{t('forgot.passwordSuccess', language)}</h3>
        </div>
      )}
    </div>
  );
}
