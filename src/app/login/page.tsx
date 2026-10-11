'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Warehouse,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import PageContainer from '@/components/shared/PageContainer';
import FieldMotion from '@/components/shared/FieldMotion';
import FormCard from '@/components/shared/FormCard';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import InputField from '@/components/shared/InputField';
import PrimaryButton from '@/components/shared/PrimaryButton';
import AlertMessage from '@/components/shared/AlertMessage';
import { getCurrentMandiSession, loginMandi } from '@/lib/mandi-service';
import { UserRole } from '@/types';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguage();

  const initialRole: UserRole = searchParams.get('role') === 'mandi' ? 'mandi' : 'farmer';
  const unauthorizedNotice = searchParams.get('unauthorized');

  const [role, setRole] = useState<UserRole>(initialRole);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Mandi Login Form State
  const [mandiIdentifier, setMandiIdentifier] = useState('');
  const [mandiPassword, setMandiPassword] = useState('');
  const [mandiLoading, setMandiLoading] = useState(false);
  const [mandiError, setMandiError] = useState<string | null>(null);

  // Sync role from query parameters if URL changes
  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'mandi' || r === 'farmer') {
      // The selected login flow mirrors a changing URL query parameter.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRole(r);
    }
  }, [searchParams]);

  // Check existing sessions
  useEffect(() => {
    if (!loading) {
      if (role === 'farmer' && user) {
        router.push('/slot-booking');
      } else if (role === 'mandi') {
        const mandiSession = getCurrentMandiSession();
        if (mandiSession) {
          router.push('/mandi/dashboard');
        }
      }
    }
  }, [user, loading, role, router]);

  // Mandi portal login submission
  const handleMandiLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMandiError(null);

    if (!mandiIdentifier.trim()) {
      setMandiError('Please enter your APMC Mandi code, email, or market yard name.');
      return;
    }

    setMandiLoading(true);
    try {
      const res = await loginMandi(mandiIdentifier, mandiPassword);
      if (res.error || !res.session) {
        setMandiError(res.error || 'Authentication failed. Please check APMC credentials.');
        setMandiLoading(false);
        return;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('km_mandi_sync'));
      }
      router.push('/mandi/dashboard');
    } catch (err: unknown) {
      setMandiError(err instanceof Error ? err.message : 'An error occurred during Mandi operator login.');
      setMandiLoading(false);
    }
  };

  // Quick Demo APMC Credentials Handler
  const handleQuickDemo = async (code: string) => {
    setMandiIdentifier(code);
    setMandiPassword('demo123');
    setMandiLoading(true);
    setMandiError(null);
    const res = await loginMandi(code, 'demo123');
    if (res.session) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('km_mandi_sync'));
      }
      router.push('/mandi/dashboard');
    } else {
      setMandiError(res.error || 'Demo login failed.');
      setMandiLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div
            className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin"
            role="status"
            aria-label={t('common.loading', language)}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="relative overflow-hidden">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center min-h-[calc(100vh-10rem)] py-6">
        
        {/* Left Informational Showcase Card */}
        <div className="hidden lg:block rounded-[2rem] overflow-hidden min-h-[640px] relative bg-primary-950 shadow-2xl">
          <FieldMotion className="opacity-50" />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(15,45,34,.36),rgba(6,20,16,.94))]" />
          <div className="relative z-10 h-full p-10 flex flex-col justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-400 text-primary-950 flex items-center justify-center font-bold shadow-md">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold tracking-wide text-base">{t('auth.brand', language)}</span>
                <p className="text-[11px] text-primary-300">{t('appTagline', language)}</p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-primary-200 border border-white/15 mb-4">
                {role === 'farmer' ? t('login.farmerRoleTitle', language) : t('login.mandiRoleTitle', language)}
              </span>

              <h2 className="display-font text-4xl sm:text-5xl leading-tight font-bold">
                {role === 'farmer'
                  ? t('login.farmerShowcaseTitle', language)
                  : t('login.mandiShowcaseTitle', language)}
              </h2>

              <div className="mt-8 space-y-3 text-sm text-primary-100">
                {role === 'farmer' ? (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{t('login.farmerPoint1', language)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{t('login.farmerPoint2', language)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{t('login.farmerPoint3', language)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>{t('login.mandiPoint1', language)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>{t('login.mandiPoint2', language)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>{t('login.mandiPoint3', language)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Container */}
        <div className="max-w-md w-full mx-auto">
          
          {/* Unauthorized Role Access Warning Banner */}
          {unauthorizedNotice && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs shadow-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-sm block mb-0.5">{t('login.unauthorizedFarmerTitle', language)}</strong>
                <span>{t('login.unauthorizedFarmerDesc', language)}</span>
              </div>
            </div>
          )}

          {/* ── ROLE SELECTOR TOGGLE (Farmer vs Mandi Portal) ── */}
          <div className="mb-6">
            <div className="bg-primary-950/90 p-1.5 rounded-2xl border border-primary-800/40 flex shadow-md">
              <button
                type="button"
                id="role-select-farmer"
                onClick={() => {
                  setRole('farmer');
                  setMandiError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === 'farmer'
                    ? 'bg-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-300/50'
                    : 'text-primary-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sprout className="w-4 h-4 shrink-0" />
                <span>{t('login.farmerRole', language)}</span>
              </button>

              <button
                type="button"
                id="role-select-mandi"
                onClick={() => {
                  setRole('mandi');
                  setMandiError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === 'mandi'
                    ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-200/50'
                    : 'text-primary-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{t('login.mandiRole', language)}</span>
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
           * PATH 1: FARMER LOGIN / REGISTRATION FLOW
           * ════════════════════════════════════════════════════════════════════ */}
          {role === 'farmer' ? (
            <div>
              {/* Top Branding */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-800 text-white rounded-2xl shadow-lg mb-3">
                  <Sprout className="w-7 h-7" aria-hidden="true" />
                </div>
                <h1 className="display-font text-3xl font-bold text-primary-950">
                  {mode === 'login' ? t('login.title', language) : t('register.title', language)}
                </h1>
                <p className="mt-1 text-xs text-primary-700">
                  {t('login.subtitle', language)}
                </p>
              </div>

              {/* Login / Register Tab Switcher */}
              <div className="flex rounded-xl border border-primary-200 bg-white/70 p-1 mb-5 shadow-sm" role="tablist">
                <button
                  id="tab-login"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-primary-800 text-white shadow-sm'
                      : 'text-primary-600 hover:text-primary-800'
                  }`}
                >
                  {t('nav.signIn', language)}
                </button>
                <button
                  id="tab-register"
                  role="tab"
                  aria-selected={mode === 'register'}
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    mode === 'register'
                      ? 'bg-primary-800 text-white shadow-sm'
                      : 'text-primary-600 hover:text-primary-800'
                  }`}
                >
                  {t('nav.register', language)}
                </button>
              </div>

              {/* Farmer Form Card */}
              <FormCard className="bg-white/95 backdrop-blur border-primary-200 shadow-xl">
                {mode === 'login' ? (
                  <LoginForm onSwitchToRegister={() => setMode('register')} />
                ) : (
                  <RegisterForm onSwitchToLogin={() => setMode('login')} />
                )}
              </FormCard>
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════════
             * PATH 2: MANDI PORTAL OPERATOR LOGIN FLOW
             * ════════════════════════════════════════════════════════════════════ */
            <div>
              {/* Top Branding */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-600 text-white rounded-2xl shadow-lg mb-3">
                  <Building2 className="w-7 h-7" aria-hidden="true" />
                </div>
                <h1 className="display-font text-3xl font-bold text-primary-950">
                  {t('login.mandiRoleTitle', language)}
                </h1>
                <p className="mt-1 text-xs text-primary-700">
                  {t('login.mandiSubtitle', language)}
                </p>
              </div>

              {/* Quick One-Click Demo Credentials */}
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    {t('login.quickDemoTitle', language)}
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-medium">
                    {t('login.quickDemoSubtitle', language)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('APMC-PUN-01')}
                    className="px-2 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 text-xs font-bold transition-all text-center shadow-xs"
                  >
                    {t('login.puneYard', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('APMC-BRM-02')}
                    className="px-2 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 text-xs font-bold transition-all text-center shadow-xs"
                  >
                    {t('login.baramatiYard', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('APMC-AHM-03')}
                    className="px-2 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 text-xs font-bold transition-all text-center shadow-xs"
                  >
                    {t('login.ahmednagarYard', language)}
                  </button>
                </div>
              </div>

              {/* Mandi Login Form Card */}
              <FormCard className="bg-white/95 backdrop-blur border-amber-200 shadow-xl">
                {mandiError && (
                  <div className="mb-4">
                    <AlertMessage type="error" message={mandiError} onDismiss={() => setMandiError(null)} />
                  </div>
                )}

                <form onSubmit={handleMandiLogin} className="space-y-4">
                  <InputField
                    id="mandi-identifier"
                    label={t('login.mandiCodeLabel', language)}
                    type="text"
                    placeholder={t('login.mandiCodePlaceholder', language)}
                    value={mandiIdentifier}
                    onChange={(e) => setMandiIdentifier(e.target.value)}
                    icon={<Building2 className="w-4 h-4" />}
                    required
                    autoComplete="username"
                  />

                  <InputField
                    id="mandi-password"
                    label={t('login.mandiPasswordLabel', language)}
                    type="password"
                    placeholder={t('login.mandiPasswordPlaceholder', language)}
                    value={mandiPassword}
                    onChange={(e) => setMandiPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    required
                    autoComplete="current-password"
                  />

                  <div className="pt-2">
                    <PrimaryButton
                      type="submit"
                      fullWidth
                      loading={mandiLoading}
                      size="lg"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    >
                      {t('login.mandiSignInBtn', language)}
                    </PrimaryButton>
                  </div>
                </form>

                <div className="pt-4 mt-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-600">
                    {t('login.mandiRegisterPrompt', language)}{' '}
                    <Link
                      href="/mandi/register"
                      className="font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2"
                    >
                      {t('login.mandiRegisterBtn', language)}
                    </Link>
                  </p>
                </div>
              </FormCard>
            </div>
          )}

        </div>
      </div>
    </PageContainer>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        </PageContainer>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
