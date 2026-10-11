'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  Sprout,
  Warehouse,
} from 'lucide-react';
import PageContainer from '@/components/shared/PageContainer';
import { loginMandi } from '@/lib/mandi-service';

export default function MandiLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your APMC Mandi code, email, or name.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginMandi(identifier, password);
      if (res.error || !res.session) {
        setError(res.error || 'Authentication failed. Please check credentials.');
        setLoading(false);
        return;
      }
      router.push('/mandi/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during login.');
      setLoading(false);
    }
  };

  const handleQuickDemo = async (code: string) => {
    setIdentifier(code);
    setPassword('demo123');
    setLoading(true);
    const res = await loginMandi(code, 'demo123');
    if (res.session) {
      router.push('/mandi/dashboard');
    } else {
      setError(res.error || 'Demo login failed.');
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-md mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="display-font text-3xl font-bold text-primary-950">Mandi Operator Sign In</h1>
          <p className="text-xs text-primary-700 mt-1">
            Access your live APMC token queue, weighbridge slots, and delay logs.
          </p>
        </div>

        {/* Quick Demo Logins */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-primary-200 shadow-sm">
          <p className="text-xs font-bold text-primary-800 uppercase tracking-wider mb-2.5">
            Quick One-Click Demo Credentials:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('APMC-PUN-01')}
              className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition-colors text-center"
            >
              Pune APMC
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('APMC-BRM-02')}
              className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition-colors text-center"
            >
              Baramati
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('APMC-AHM-03')}
              className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition-colors text-center"
            >
              Ahmednagar
            </button>
          </div>
        </div>

        {/* Sign In Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 rounded-3xl border border-primary-200 shadow-xl p-6 sm:p-7 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="mandi-code" className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1.5">
              APMC License Code / Mandi Email / Yard Name *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-primary-400">
                <Warehouse className="w-4 h-4" />
              </span>
              <input
                id="mandi-code"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. APMC-PUN-01 or Pune APMC"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-primary-200 bg-primary-50/50 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="mandi-pwd" className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1.5">
              Operator Password *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-primary-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="mandi-pwd"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-primary-200 bg-primary-50/50 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3.5 rounded-xl transition-all shadow-md hover:shadow-emerald-600/25 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying Mandi Access...</span>
            ) : (
              <>
                <span>Sign In to Mandi Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-4 border-t border-primary-100 text-center">
            <p className="text-xs text-primary-700">
              Operating a new market yard?{' '}
              <Link href="/mandi/register" className="font-bold text-emerald-700 hover:underline">
                Register your APMC Mandi
              </Link>
            </p>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
