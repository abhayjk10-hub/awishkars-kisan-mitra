'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import InputField from '@/components/shared/InputField';
import PrimaryButton from '@/components/shared/PrimaryButton';
import AlertMessage from '@/components/shared/AlertMessage';
import { parseRegisteredFarmers, type RegisteredFarmerRecord } from '@/lib/registered-farmers';
import ForgotPasswordFlow from '@/components/auth/ForgotPasswordFlow';

type ActiveView = 'login' | 'forgot-password';

export default function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { language } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [activeView, setActiveView] = useState<ActiveView>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  // Auto-prefill identifier if farmer just registered or reset password
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const last = localStorage.getItem('km_last_registered_identifier');
        if (last && !identifier) {
          // The saved identifier is browser-only state and must be read after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIdentifier(last);
        }
      }
    } catch {}
  }, []);

  const validateIdentifier = (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.includes('@')) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    }
    const digitsOnly = trimmed.replace(/\D/g, '');
    return digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91'));
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * SUBMIT LOGIN (Email or Mobile + Password)
   * ───────────────────────────────────────────────────────────────────────── */
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!identifier.trim()) {
      newErrors.identifier = t('validation.required.mobile', language);
    } else if (!validateIdentifier(identifier)) {
      newErrors.identifier = t('validation.invalid.mobile', language);
    }

    if (!password) {
      newErrors.password = t('login.password', language);
    } else if (password.length < 6) {
      newErrors.password = t('forgot.passwordTooShort', language);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const isEmail = identifier.includes('@');
      const cleanEmail = identifier.trim().toLowerCase();
      const digits = identifier.trim().replace(/\D/g, '');
      const tenDigits = digits.slice(-10);
      const formattedPhone = '+91' + tenDigits;

      let authResponse: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>> | null = null;

      if (isEmail) {
        authResponse = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });
      } else {
        // Try all representations against Supabase Auth:
        // 1. Raw 10-digit number (e.g. 7700037441)
        // 2. E.164 with +91 (e.g. +917700037441)
        // 3. Country code without plus (e.g. 917700037441)
        // 4. Raw string as typed
        const candidates = Array.from(
          new Set([
            tenDigits,
            formattedPhone,
            '91' + tenDigits,
            identifier.trim(),
          ])
        ).filter(Boolean);

        for (const phoneAttempt of candidates) {
          try {
            const resp = await supabase.auth.signInWithPassword({
              phone: phoneAttempt,
              password: password,
            });
            if (!resp.error && resp.data?.user) {
              authResponse = resp;
              break;
            } else {
              authResponse = resp;
            }
          } catch {
            // try next candidate
          }
        }
      }

      const { data, error } = authResponse || {};

      if (!error && data?.user) {
        // Successful Supabase authentication
        const userObj = {
          id: data.user.id,
          phone: data.user.phone || (isEmail ? null : formattedPhone),
          email: data.user.email || (isEmail ? cleanEmail : null),
          user_metadata: data.user.user_metadata || {
            full_name: 'Registered Farmer',
            name: 'Registered Farmer',
          },
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('km_user_session', JSON.stringify(userObj));
          window.dispatchEvent(new Event('km_auth_change'));
        }

        setAlert({ type: 'success', message: 'Login successful! Redirecting to Home page...' });
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 700);
        return;
      }

      // If Supabase returned error or phone format mismatch, check local registration and password store
      let matchedRecord: RegisteredFarmerRecord | null = null;
      let matchedStoredPassword: string | null = null;

      if (typeof window !== 'undefined') {
        const keysToTry = isEmail
          ? [`km_pw_${cleanEmail}`, `km_reg_${cleanEmail}`, `km_reg_${identifier.trim()}`]
          : [
              `km_pw_${tenDigits}`,
              `km_pw_${formattedPhone}`,
              `km_pw_${identifier.trim()}`,
              `km_reg_${tenDigits}`,
              `km_reg_${formattedPhone}`,
              `km_reg_${identifier.trim()}`,
            ];

        for (const k of keysToTry) {
          const item = localStorage.getItem(k);
          if (item) {
            try {
              if (item.startsWith('{')) {
                const parsed = JSON.parse(item);
                if (parsed.password) {
                  matchedRecord = parsed;
                  matchedStoredPassword = parsed.password;
                  break;
                }
              } else {
                matchedRecord = { fullName: 'Farmer' };
                matchedStoredPassword = item;
                break;
              }
            } catch {}
          }
        }

        if (!matchedStoredPassword) {
          try {
            const list = parseRegisteredFarmers(localStorage.getItem('km_registered_farmers'));
            if (list.length > 0) {
              const found = list.find((u) =>
                isEmail
                  ? u.email === cleanEmail || u.identifier === cleanEmail
                  : u.phone?.replace(/\D/g, '').slice(-10) === tenDigits ||
                    u.identifier?.replace(/\D/g, '').slice(-10) === tenDigits
              );
              if (found?.password) {
                matchedRecord = found;
                matchedStoredPassword = found.password;
              }
            }
          } catch {
            // Ignore malformed cached registration data and continue with other login formats.
          }
        }
      }

      if (matchedStoredPassword) {
        if (matchedStoredPassword === password) {
          // Password verified against user registration or reset!
          const userObj = {
            id: 'farmer-' + (isEmail ? cleanEmail.replace(/[^a-z0-9]/g, '') : tenDigits),
            phone: isEmail ? null : formattedPhone,
            email: isEmail ? cleanEmail : null,
            user_metadata: {
              full_name: matchedRecord?.fullName || 'Registered Farmer',
              name: matchedRecord?.fullName || 'Registered Farmer',
            },
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('km_user_session', JSON.stringify(userObj));
            window.dispatchEvent(new Event('km_auth_change'));
          }

          setAlert({ type: 'success', message: t('login.success', language) });
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 700);
          return;
        } else {
          throw new Error(t('error.generic', language));
        }
      }

      // If no local record found either, report clear actionable message
      throw new Error(t('forgot.accountNotFound', language));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('error.generic', language);
      setAlert({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSuccess = (updatedIdentifier: string) => {
    setIdentifier(updatedIdentifier);
    setPassword('');
    setActiveView('login');
    setAlert({
      type: 'success',
      message: t('forgot.passwordSuccess', language),
    });
  };

  if (activeView === 'forgot-password') {
    return (
      <ForgotPasswordFlow
        initialIdentifier={identifier}
        onSuccess={handleForgotPasswordSuccess}
        onCancel={() => {
          setActiveView('login');
          setAlert(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
      )}

      {/* ── EMAIL OR MOBILE + PASSWORD LOGIN FORM ── */}
      <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
        <InputField
          id="login-identifier"
          label={t('login.identifierLabel', language)}
          type="text"
          placeholder={t('login.identifierPlaceholder', language)}
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

        <div className="space-y-1">
          <InputField
            id="login-password"
            label={t('login.password', language)}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('login.passwordPlaceholder', language)}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-gray-400 hover:text-primary-700 p-1 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveView('forgot-password');
                setAlert(null);
              }}
              className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors focus:outline-none focus:underline"
            >
              {t('login.forgotPassword', language)}
            </button>
          </div>
        </div>

        <PrimaryButton type="submit" fullWidth loading={loading} size="lg">
          {t('login.signInBtn', language)}
        </PrimaryButton>
      </form>

      {/* Switch to Register */}
      <div className="pt-3 border-t border-primary-100 text-center">
        <p className="text-sm text-gray-600">
          {t('login.newFarmer', language)}{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-primary-600 hover:text-primary-800 underline underline-offset-2 transition-colors"
          >
            {t('login.registerNow', language)}
          </button>
        </p>
      </div>
    </div>
  );
}