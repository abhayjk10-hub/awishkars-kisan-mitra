'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Compass,
  LocateFixed,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Warehouse,
} from 'lucide-react';
import PageContainer from '@/components/shared/PageContainer';
import { registerMandi } from '@/lib/mandi-service';

export default function MandiRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [district, setDistrict] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('18.5204');
  const [longitude, setLongitude] = useState('73.8567');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slotCapacity, setSlotCapacity] = useState('6');
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('18:00');

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(4));
        setLongitude(pos.coords.longitude.toFixed(4));
        setLocating(false);
      },
      (err) => {
        alert(err.message || 'Could not retrieve current GPS coordinates.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim() || !address.trim() || !contactPerson.trim() || !contactPhone.trim()) {
      setError('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerMandi({
        name,
        code,
        license_no: licenseNo || undefined,
        district,
        state,
        address,
        latitude: parseFloat(latitude) || 18.5204,
        longitude: parseFloat(longitude) || 73.8567,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        password,
        slot_capacity: parseInt(slotCapacity, 10) || 6,
        opening_time: openingTime,
        closing_time: closingTime,
      });

      if (res.error) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      router.push('/mandi/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register mandi.');
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="display-font text-3xl font-bold text-primary-950">APMC Mandi Registration</h1>
          <p className="text-xs text-primary-700 mt-1">
            Register your Agriculture Produce Market Committee yard to enable verified slot queue management.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/95 rounded-3xl border border-primary-200 shadow-xl p-6 sm:p-8 space-y-6"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Section 1: APMC Details */}
          <div>
            <h3 className="text-sm font-bold text-primary-950 uppercase tracking-wider border-b border-primary-100 pb-2 mb-4 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-emerald-600" />
              Market Yard Information
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Mandi Official Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pune APMC Market Yard (Gultekdi)"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Unique Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APMC-PUN-01"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  APMC License / Reg Number
                </label>
                <input
                  type="text"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="e.g. LIC-MH-PUN-2026-001"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  District *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Physical Yard Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full street address and landmark"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider">
                    Longitude
                  </label>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <LocateFixed className="w-3 h-3" />
                    {locating ? 'Locating...' : 'Use My GPS'}
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Timings & Slot Capacity */}
          <div>
            <h3 className="text-sm font-bold text-primary-950 uppercase tracking-wider border-b border-primary-100 pb-2 mb-4 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-emerald-600" />
              Operating Timings & 30-Minute Capacity
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  required
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  required
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Capacity / 30-Min Window
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={slotCapacity}
                  onChange={(e) => setSlotCapacity(e.target.value)}
                  placeholder="e.g. 6"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Administrator Details */}
          <div>
            <h3 className="text-sm font-bold text-primary-950 uppercase tracking-wider border-b border-primary-100 pb-2 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Market Yard Secretary / Gate Manager
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Officer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Suresh Patil"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Official Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 9822012345"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="secretary.apmc@gov.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                  Create Admin Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/25 disabled:opacity-50"
          >
            {submitting ? (
              <span>Registering APMC Yard...</span>
            ) : (
              <>
                <span>Complete Registration & Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-primary-700">
              Already registered?{' '}
              <Link href="/mandi/login" className="font-bold text-emerald-700 hover:underline">
                Sign in to your Mandi
              </Link>
            </p>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
