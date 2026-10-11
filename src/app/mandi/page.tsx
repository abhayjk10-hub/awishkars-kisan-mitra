'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sprout,
  Users,
  Warehouse,
  Zap,
} from 'lucide-react';
import PageContainer from '@/components/shared/PageContainer';
import { getCurrentMandiSession, loginMandi } from '@/lib/mandi-service';

export default function MandiGatewayPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getCurrentMandiSession();
    if (session) {
      router.push('/mandi/dashboard');
    } else {
      // Session state is read from browser storage after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
    }
  }, [router]);

  const handleQuickDemo = async (code: string) => {
    const res = await loginMandi(code);
    if (res.session) {
      router.push('/mandi/dashboard');
    }
  };

  if (checking) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto py-8">
        {/* Top Hero Card */}
        <div className="rounded-[2.5rem] bg-gradient-to-br from-primary-950 via-primary-900 to-emerald-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-primary-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
              <Building2 className="w-4 h-4 text-emerald-400" />
              APMC Market Yard Administration
            </div>
            <h1 className="display-font text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Mandi Token Management & Live Gate Operations
            </h1>
            <p className="text-primary-200 mt-4 text-base sm:text-lg leading-relaxed">
              Real-time slot tracking, 30-minute queue management, walk-in farmer gate entry, and cross-mandi delay penalty accountability for APMC Mandis across India.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/mandi/login"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-primary-950 font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25"
              >
                <span>Mandi Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/mandi/register"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-6 py-3.5 rounded-xl transition-all"
              >
                <span>Register New APMC Mandi</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Fast Demo Quick Logins */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-primary-950">Quick Demo Access (One-Click)</h2>
              <p className="text-xs text-primary-700">Test live queue sync immediately as an official APMC Yard</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Instant Demo
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleQuickDemo('APMC-PUN-01')}
              className="p-5 rounded-2xl bg-white border-2 border-primary-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800">
                  APMC-PUN-01
                </span>
                <ArrowRight className="w-4 h-4 text-primary-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h3 className="font-bold text-primary-950 text-base">Pune APMC Market Yard</h3>
              <p className="text-xs text-primary-600 mt-1">Gultekdi, Pune • Capacity: 6/slot</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('APMC-BRM-02')}
              className="p-5 rounded-2xl bg-white border-2 border-primary-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800">
                  APMC-BRM-02
                </span>
                <ArrowRight className="w-4 h-4 text-primary-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h3 className="font-bold text-primary-950 text-base">Baramati APMC Yard</h3>
              <p className="text-xs text-primary-600 mt-1">MIDC Road, Baramati • Capacity: 5/slot</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('APMC-AHM-03')}
              className="p-5 rounded-2xl bg-white border-2 border-primary-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800">
                  APMC-AHM-03
                </span>
                <ArrowRight className="w-4 h-4 text-primary-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h3 className="font-bold text-primary-950 text-base">Ahmednagar Main Yard</h3>
              <p className="text-xs text-primary-600 mt-1">Goods Shed, Ahmednagar • Capacity: 8/slot</p>
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-2xl bg-white border border-primary-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-primary-950 text-base">Bidirectional Real-Time Sync</h3>
            <p className="text-xs text-primary-700 mt-2 leading-relaxed">
              When farmers book online, tokens appear instantly on the operator&apos;s queue. When marked active, farmers receive immediate notification.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-primary-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Clock3 className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-bold text-primary-950 text-base">30-Minute Window Enforcement</h3>
            <p className="text-xs text-primary-700 mt-2 leading-relaxed">
              Strict 30-minute allocation ensures smooth weighbridge turnaround, eliminating highway truck congestion and market yard bottlenecks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-primary-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
            </div>
            <h3 className="font-bold text-primary-950 text-base">Network-Wide Delay Tracking</h3>
            <p className="text-xs text-primary-700 mt-2 leading-relaxed">
              Cross-mandi delay and no-show logging holds repeat offenders accountable across all APMC mandis connected to the Kisan Mitra network.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
