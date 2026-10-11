'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Clock3,
  Copy,
  Database,
  Eye,
  FileSpreadsheet,
  Filter,
  History,
  LogOut,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Truck,
  User,
  UserCheck,
  UserPlus,
  Users,
  Warehouse,
  Wheat,
  X,
  Zap,
} from 'lucide-react';
import PageContainer from '@/components/shared/PageContainer';
import {
  Mandi,
  MandiSession,
  SlotBooking,
  SlotStatus,
  FarmerDelay,
} from '@/types';
import {
  getCurrentMandiSession,
  getMandis,
  getMandiQueue,
  updateTokenStatus,
  createWalkinToken,
  getAllFarmerDelays,
  getFarmerDelays,
  subscribeToMandiQueue,
  logoutMandi,
  loginMandi,
} from '@/lib/mandi-service';

export default function MandiDashboardPage() {
  const router = useRouter();

  // Session & Mandi State
  const [session, setSession] = useState<MandiSession | null>(null);
  const [allMandis, setAllMandis] = useState<Mandi[]>([]);
  const [loading, setLoading] = useState(true);

  // Queue Data
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [queue, setQueue] = useState<SlotBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SlotStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Cross-Mandi Delays & Network Watchlist
  const [networkDelays, setNetworkDelays] = useState<FarmerDelay[]>([]);
  const [farmerDelayCounts, setFarmerDelayCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'queue' | 'watchlist' | 'analytics'>('queue');
  const [watchlistSearch, setWatchlistSearch] = useState('');

  // Modals
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [walkinData, setWalkinData] = useState({
    farmer_name: '',
    farmer_phone: '',
    crop_name: 'Wheat (गहू)',
    quantity_quintals: '10',
    vehicle_number: '',
  });
  const [submittingWalkin, setSubmittingWalkin] = useState(false);

  // Delay/No-Show Report Modal
  const [delayModalBooking, setDelayModalBooking] = useState<SlotBooking | null>(null);
  const [delayType, setDelayType] = useState<'no_show' | 'late_arrival'>('no_show');
  const [delayMinutes, setDelayMinutes] = useState('30');
  const [delayReason, setDelayReason] = useState('Farmer did not arrive for scheduled 30-minute unloading window.');
  const [loggingDelay, setLoggingDelay] = useState(false);

  // Inspection/Offense Detail Modal
  const [inspectPhone, setInspectPhone] = useState<string | null>(null);
  const [inspectDelays, setInspectDelays] = useState<FarmerDelay[]>([]);

  // Supabase SQL Schema Modal
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load session
  useEffect(() => {
    const s = getCurrentMandiSession();
    if (!s) {
      router.push('/login?role=mandi&unauthorized=farmer');
      return;
    }
    // The operator session is stored in the browser and must be read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(s);
    getMandis().then(setAllMandis);
    setLoading(false);
  }, [router]);

  // Load Queue & Delays
  const refreshQueue = useCallback(async () => {
    if (!session?.mandi?.id) return;
    setRefreshing(true);
    try {
      const bookings = await getMandiQueue(session.mandi.id, selectedDate);
      setQueue(bookings);

      const delays = await getAllFarmerDelays();
      setNetworkDelays(delays);

      // Build map of delays by phone
      const counts: Record<string, number> = {};
      for (const d of delays) {
        const clean = d.farmer_phone.replace(/\D/g, '').slice(-10);
        counts[clean] = (counts[clean] || 0) + 1;
      }
      setFarmerDelayCounts(counts);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [session, selectedDate]);

  useEffect(() => {
    if (session?.mandi?.id) {
      // This starts the queue refresh for the current operator and date.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshQueue();
    }
  }, [refreshQueue]);

  // Real-Time Queue Subscription
  useEffect(() => {
    if (!session?.mandi?.id) return;

    const unsub = subscribeToMandiQueue(session.mandi.id, (event) => {
      refreshQueue();
      if (event?.type === 'SLOT_BOOKED' && event.payload) {
        setToastMessage(`🚨 New Farmer Booking: #${event.payload.token_number} (${event.payload.farmer_name})`);
        setTimeout(() => setToastMessage(null), 5000);
      } else if (event?.type === 'SLOT_CANCELLED') {
        const payload = event.payload;
        setToastMessage(`⚠️ Slot Freed by Cancellation: #${payload?.booking?.token_number || payload?.bookingId}`);
        setTimeout(() => setToastMessage(null), 5000);
      } else if (event?.type === 'SLOT_PROMOTED') {
        const payload = event.payload;
        setToastMessage(`🎉 Waitlist Auto-Assigned: #${payload?.booking?.token_number} (${payload?.booking?.farmer_name}) promoted to slot!`);
        setTimeout(() => setToastMessage(null), 7000);
      }
    });

    return () => unsub();
  }, [session?.mandi?.id, refreshQueue]);

  // Switch Mandi Yard
  const handleSwitchMandi = async (mandiId: string) => {
    const target = allMandis.find((m) => m.id === mandiId);
    if (!target) return;
    const res = await loginMandi(target.code);
    if (res.session) {
      setSession(res.session);
    }
  };

  const handleLogout = () => {
    logoutMandi();
    router.push('/mandi/login');
  };

  // Status transitions
  const handleMarkActive = async (booking: SlotBooking) => {
    await updateTokenStatus(booking.id, 'active');
    refreshQueue();
  };

  const handleMarkCompleted = async (booking: SlotBooking) => {
    await updateTokenStatus(booking.id, 'completed');
    refreshQueue();
  };

  const handleOpenDelayModal = (booking: SlotBooking) => {
    setDelayModalBooking(booking);
    setDelayType('no_show');
    setDelayMinutes('30');
    setDelayReason('Farmer missed allocated 30-min window without prior notice.');
  };

  const handleConfirmDelay = async () => {
    if (!delayModalBooking) return;
    setLoggingDelay(true);
    try {
      await updateTokenStatus(delayModalBooking.id, delayType === 'no_show' ? 'no-show' : 'waiting', {
        delay_minutes: parseInt(delayMinutes, 10) || 30,
        reason: delayReason,
        reported_by: `${session?.mandi?.name || 'Mandi'} Gate Operator`,
        penalty_points: delayType === 'no_show' ? 2 : 1,
      });
      setDelayModalBooking(null);
      refreshQueue();
    } finally {
      setLoggingDelay(false);
    }
  };

  // Walk-in Registration Submit
  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.mandi?.id) return;
    if (!walkinData.farmer_name.trim() || !walkinData.farmer_phone.trim()) {
      alert('Please enter farmer name and mobile number.');
      return;
    }
    if (!walkinData.vehicle_number.trim()) {
      alert('Please enter the vehicle number.');
      return;
    }

    setSubmittingWalkin(true);
    try {
      await createWalkinToken(session.mandi.id, {
        farmer_name: walkinData.farmer_name,
        farmer_phone: walkinData.farmer_phone,
        crop_name: walkinData.crop_name,
        quantity_quintals: Number(walkinData.quantity_quintals) || 10,
        vehicle_number: walkinData.vehicle_number.trim().toUpperCase(),
      });

      setWalkinModalOpen(false);
      setWalkinData({
        farmer_name: '',
        farmer_phone: '',
        crop_name: 'Wheat (गहू)',
        quantity_quintals: '10',
        vehicle_number: '',
      });
      refreshQueue();
    } finally {
      setSubmittingWalkin(false);
    }
  };

  // Inspect farmer history across mandis
  const handleInspectFarmer = async (phone: string) => {
    setInspectPhone(phone);
    const delays = await getFarmerDelays(phone);
    setInspectDelays(delays);
  };

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.token_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.farmer_phone.includes(searchQuery) ||
        b.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.vehicle_number && b.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [queue, searchQuery, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = queue.length;
    const waiting = queue.filter((b) => b.status === 'waiting').length;
    const active = queue.filter((b) => b.status === 'active').length;
    const completed = queue.filter((b) => b.status === 'completed').length;
    const noshow = queue.filter((b) => b.status === 'no-show').length;
    const waitlisted = queue.filter((b) => b.status === 'waitlisted').length;
    const cancelled = queue.filter((b) => b.status === 'cancelled').length;
    return { total, waiting, active, completed, noshow, waitlisted, cancelled };
  }, [queue]);

  if (loading || !session) {
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
      <div className="max-w-7xl mx-auto pb-16">
        {/* Real-time Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-5 z-50 bg-emerald-950 border-2 border-emerald-400 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-sm font-bold">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/70 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TOP BAR: Mandi Selector & Live Sync Badge */}
        <div className="bg-white/95 rounded-3xl border border-primary-200 shadow-md p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-primary-950 leading-tight">
                  {session.mandi.name}
                </h1>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {session.mandi.code}
                </span>
              </div>
              <p className="text-xs text-primary-600 mt-0.5">
                {session.mandi.address} • Operating: {session.mandi.opening_time} – {session.mandi.closing_time} • Capacity: {session.mandi.slot_capacity}/slot
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {/* Supabase Schema Helper */}
            <button
              type="button"
              onClick={() => setSchemaModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-800 bg-primary-100 hover:bg-primary-200 px-3.5 py-2 rounded-xl transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-primary-700" />
              <span>SQL Schema</span>
            </button>

            {/* Switch Mandi Dropdown */}
            <div className="relative">
              <select
                value={session.mandi.id}
                onChange={(e) => handleSwitchMandi(e.target.value)}
                className="text-xs font-bold bg-primary-50 border border-primary-200 text-primary-900 rounded-xl px-3 py-2 pr-7 appearance-none focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {allMandis.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-primary-600 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-6">
          <div className="p-4 rounded-2xl bg-white border border-primary-200 shadow-sm">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Total Slots</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary-950 mt-1">{metrics.total}</div>
            <span className="text-[11px] text-primary-500 font-semibold">Booked today</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Waiting</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-950 mt-1">{metrics.waiting}</div>
            <span className="text-[11px] text-amber-700 font-semibold">In queue</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Now</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1">{metrics.active}</div>
            <span className="text-[11px] text-emerald-700 font-semibold">Weighing / Unloading</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-primary-200 shadow-sm">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Completed</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary-950 mt-1">{metrics.completed}</div>
            <span className="text-[11px] text-primary-500 font-semibold">Processed</span>
          </div>

          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">No-Shows</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-900 mt-1">{metrics.noshow}</div>
            <span className="text-[11px] text-red-600 font-semibold">Penalties logged</span>
          </div>
        </div>

        {/* TABS: Queue Dashboard vs Network Delay Watchlist */}
        <div className="flex items-center justify-between border-b border-primary-200 mb-6 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'queue'
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'text-primary-700 hover:bg-primary-100'
              }`}
            >
              <Clock3 className="w-4 h-4" />
              <span>Live Token Queue ({queue.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('watchlist')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'watchlist'
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'text-primary-700 hover:bg-primary-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Network Penalty Watchlist ({networkDelays.length})</span>
            </button>
          </div>

          {/* Gate Walk-in Registration Button */}
          <button
            type="button"
            onClick={() => setWalkinModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Walk-in Gate Entry</span>
          </button>
        </div>

        {/* TAB 1: LIVE TOKEN QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white border border-primary-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-primary-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Token, Farmer, Mobile, Crop, Vehicle..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-primary-200 text-primary-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | SlotStatus)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-primary-200 text-primary-800 bg-white"
                >
                  <option value="all">All Statuses ({metrics.total})</option>
                  <option value="waiting">Waiting Only ({metrics.waiting})</option>
                  <option value="active">Active Only ({metrics.active})</option>
                  <option value="completed">Completed Only ({metrics.completed})</option>
                  <option value="no-show">No-Show Only ({metrics.noshow})</option>
                  <option value="waitlisted">Waitlisted Queue ({metrics.waitlisted})</option>
                  <option value="cancelled">Cancelled Slots ({metrics.cancelled})</option>
                </select>
              </div>

              {/* Date Selector & Refresh */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-bold px-3 py-2 rounded-xl border border-primary-200 text-primary-900 bg-white"
                />
                <button
                  type="button"
                  onClick={refreshQueue}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-primary-100 hover:bg-primary-200 text-primary-800 transition-colors"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Queue Cards / Table */}
            {filteredQueue.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-primary-200 shadow-sm">
                <Clock3 className="w-12 h-12 text-primary-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-primary-950">No slot tokens found for {selectedDate}</h3>
                <p className="text-xs text-primary-600 mt-1 max-w-md mx-auto">
                  Farmers booking on Kisan Mitra will appear here automatically in real time. You can also add physical walk-ins using &quot;Walk-in Gate Entry&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueue.map((booking) => {
                  const cleanPhone = booking.farmer_phone.replace(/\D/g, '').slice(-10);
                  const delayCount = farmerDelayCounts[cleanPhone] || 0;
                  const isActive = booking.status === 'active';
                  const isCompleted = booking.status === 'completed';
                  const isNoShow = booking.status === 'no-show';
                  const isWaitlisted = booking.status === 'waitlisted';
                  const isCancelled = booking.status === 'cancelled';

                  return (
                    <div
                      key={booking.id}
                      className={`p-5 rounded-2xl border-2 transition-all shadow-sm ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                          : isNoShow
                          ? 'border-red-200 bg-red-50/30'
                          : isWaitlisted
                          ? 'border-indigo-200 bg-indigo-50/40'
                          : isCancelled
                          ? 'border-primary-100 bg-primary-50/20 opacity-60'
                          : isCompleted
                          ? 'border-primary-100 bg-primary-50/20 opacity-75'
                          : 'border-primary-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Token and Farmer Info */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="display-font text-lg font-extrabold text-primary-950 tracking-wide">
                              #{booking.token_number}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-emerald-600 text-white animate-pulse'
                                  : isNoShow
                                  ? 'bg-red-600 text-white'
                                  : isWaitlisted
                                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                  : isCancelled
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : isCompleted
                                  ? 'bg-primary-200 text-primary-900'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-white' : isNoShow ? 'bg-white' : isWaitlisted ? 'bg-indigo-600' : isCancelled ? 'bg-red-600' : isCompleted ? 'bg-primary-700' : 'bg-amber-600'
                                }`}
                              />
                              {isWaitlisted && booking.waitlist_position
                                ? `Waitlist #${booking.waitlist_position}`
                                : booking.status}
                            </span>

                            {booking.is_walkin && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                Walk-in Gate
                              </span>
                            )}

                            {/* Network Delay Flag if repeat offender */}
                            {delayCount > 0 && (
                              <button
                                type="button"
                                onClick={() => handleInspectFarmer(booking.farmer_phone)}
                                className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1 transition-colors"
                              >
                                <ShieldAlert className="w-3 h-3 text-amber-700" />
                                <span>{delayCount} Network Delay(s)</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-primary-900 font-semibold flex-wrap">
                            <span className="flex items-center gap-1 text-primary-950 font-bold">
                              <User className="w-3.5 h-3.5 text-primary-600" />
                              {booking.farmer_name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-primary-700">
                              <Phone className="w-3.5 h-3.5 text-primary-500" />
                              +91 {booking.farmer_phone}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-primary-800">
                              <Wheat className="w-3.5 h-3.5 text-emerald-700" />
                              {booking.crop_name} ({booking.quantity_quintals} Qtl)
                            </span>
                            {booking.vehicle_number && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-primary-700">
                                  <Truck className="w-3.5 h-3.5 text-primary-500" />
                                  {booking.vehicle_number}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 30-Min Window and Countdown */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-primary-950 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-700" />
                              {booking.slot_start_time} – {booking.slot_end_time}
                            </div>
                            <span className="text-[10px] text-primary-500 block">30-min window</span>
                          </div>

                          {/* Action Buttons based on status */}
                          <div className="flex items-center gap-2">
                            {booking.status === 'waiting' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleMarkActive(booking)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Admit & Mark Active</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelayModal(booking)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>No-Show / Late</span>
                                </button>
                              </>
                            )}

                            {booking.status === 'waitlisted' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await updateTokenStatus(booking.id, 'waiting');
                                  refreshQueue();
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Promote to Queue</span>
                              </button>
                            )}

                            {booking.status === 'cancelled' && (
                              <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                                {booking.cancellation_reason || 'Cancelled'}
                              </span>
                            )}

                            {booking.status === 'active' && (
                              <>
                                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-200/80 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                                  <span>Unloading In Progress</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleMarkCompleted(booking)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs shadow-sm transition-all"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Complete Slot</span>
                                </button>
                              </>
                            )}

                            {booking.status === 'completed' && (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Processed
                              </span>
                            )}

                            {booking.status === 'no-show' && (
                              <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                                <ShieldAlert className="w-4 h-4" />
                                Penalized
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NETWORK PENALTY & DELAY WATCHLIST */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-amber-950">
                    Centralized Cross-Mandi Delay & Penalty Watchlist
                  </h3>
                  <p className="text-xs text-amber-900 mt-1">
                    When any mandi records a no-show or late arrival, it instantly synchronizes to this shared Supabase database. Mandi officers across Maharashtra and all connected APMCs can inspect repeat offenders to prioritize punctual farmers.
                  </p>
                </div>
              </div>
            </div>

            {/* Search across network */}
            <div className="p-4 rounded-2xl bg-white border border-primary-200 shadow-sm flex items-center gap-3">
              <Search className="w-4 h-4 text-primary-400" />
              <input
                type="text"
                value={watchlistSearch}
                onChange={(e) => setWatchlistSearch(e.target.value)}
                placeholder="Search delays by farmer name, mobile number, reporting mandi, or reason..."
                className="w-full text-xs text-primary-950 focus:outline-none"
              />
            </div>

            {networkDelays.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-primary-200 shadow-sm">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-primary-950">No Delay Penalties Recorded Yet</h3>
                <p className="text-xs text-primary-600 mt-1">
                  All farmers are operating punctually! Delays reported by any mandi in the network will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-primary-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-primary-50 text-primary-800 font-bold border-b border-primary-200">
                      <tr>
                        <th className="p-4">Farmer Details</th>
                        <th className="p-4">Reporting Mandi</th>
                        <th className="p-4">Offense Type</th>
                        <th className="p-4">Delay Minutes</th>
                        <th className="p-4">Penalty Points</th>
                        <th className="p-4">Reason Given</th>
                        <th className="p-4">Logged At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-100">
                      {networkDelays
                        .filter((d) => {
                          if (!watchlistSearch) return true;
                          const s = watchlistSearch.toLowerCase();
                          return (
                            d.farmer_name.toLowerCase().includes(s) ||
                            d.farmer_phone.includes(s) ||
                            d.mandi_name.toLowerCase().includes(s) ||
                            (d.reason && d.reason.toLowerCase().includes(s))
                          );
                        })
                        .map((delay) => (
                          <tr key={delay.id} className="hover:bg-primary-50/50 transition-colors">
                            <td className="p-4">
                              <strong className="block text-primary-950 font-bold">{delay.farmer_name}</strong>
                              <span className="text-primary-600">+91 {delay.farmer_phone}</span>
                            </td>
                            <td className="p-4 font-semibold text-primary-900">{delay.mandi_name}</td>
                            <td className="p-4">
                              <span
                                className={`font-bold px-2 py-0.5 rounded uppercase text-[10px] ${
                                  delay.delay_type === 'no_show'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {delay.delay_type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-primary-900">+{delay.delay_minutes} min</td>
                            <td className="p-4">
                              <span className="font-extrabold text-red-600">+{delay.penalty_points} pts</span>
                            </td>
                            <td className="p-4 text-primary-700 max-w-xs">{delay.reason || 'None specified'}</td>
                            <td className="p-4 text-primary-500 whitespace-nowrap">
                              {new Date(delay.created_at).toLocaleDateString()} {new Date(delay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: WALK-IN GATE ENTRY */}
        {walkinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-primary-200 overflow-hidden relative animate-in zoom-in-95">
              <div className="bg-emerald-800 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setWalkinModalOpen(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <UserPlus className="w-4 h-4 text-emerald-300" />
                  Direct Physical Entry
                </div>
                <h3 className="display-font text-2xl font-bold mt-1 text-white">Issue Walk-in Token</h3>
                <p className="text-xs text-emerald-100 mt-1">
                  Create an ad-hoc 30-min slot token for farmers arriving at gate without pre-booking.
                </p>
              </div>

              <form onSubmit={handleWalkinSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                    Farmer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkinData.farmer_name}
                    onChange={(e) => setWalkinData({ ...walkinData, farmer_name: e.target.value })}
                    placeholder="e.g. Tukaram Shinde"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={walkinData.farmer_phone}
                    onChange={(e) => setWalkinData({ ...walkinData, farmer_phone: e.target.value })}
                    placeholder="9822123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                      Produce / Crop
                    </label>
                    <select
                      value={walkinData.crop_name}
                      onChange={(e) => setWalkinData({ ...walkinData, crop_name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 text-xs focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Wheat (गहू)">Wheat / गहू</option>
                      <option value="Soybean (सोयाबीन)">Soybean / सोयाबीन</option>
                      <option value="Cotton (कापूस)">Cotton / कापूस</option>
                      <option value="Onion (कांदा)">Onion / कांदा</option>
                      <option value="Gram / Chana (हरभरा)">Gram / हरभरा</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                      Qty (Quintals)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={walkinData.quantity_quintals}
                      onChange={(e) => setWalkinData({ ...walkinData, quantity_quintals: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                    Vehicle Number <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={walkinData.vehicle_number}
                    onChange={(e) => setWalkinData({ ...walkinData, vehicle_number: e.target.value })}
                    placeholder="MH-12-XY-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 text-sm focus:outline-none focus:border-emerald-600 uppercase"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setWalkinModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-primary-200 text-primary-800 font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWalkin}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md disabled:opacity-50"
                  >
                    {submittingWalkin ? 'Generating...' : 'Issue Token'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: REPORT DELAY OR NO-SHOW */}
        {delayModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-primary-200 overflow-hidden relative animate-in zoom-in-95">
              <div className="bg-red-800 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setDelayModalBooking(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-red-200 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-red-300" />
                  Network Penalty Enforcement
                </div>
                <h3 className="display-font text-2xl font-bold mt-1 text-white">Report Delay / No-Show</h3>
                <p className="text-xs text-red-100 mt-1">
                  Flag token #{delayModalBooking.token_number} ({delayModalBooking.farmer_name}).
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                    Offense Severity *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDelayType('no_show')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        delayType === 'no_show'
                          ? 'bg-red-700 text-white border-red-700 shadow-sm'
                          : 'bg-primary-50 border-primary-200 text-primary-800'
                      }`}
                    >
                      Complete No-Show (2 Pts)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDelayType('late_arrival')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        delayType === 'late_arrival'
                          ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                          : 'bg-primary-50 border-primary-200 text-primary-800'
                      }`}
                    >
                      Late Arrival (1 Pt)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                    Delay Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary-800 uppercase tracking-wider mb-1">
                    Reason For Delay / No-Show *
                  </label>
                  <textarea
                    rows={3}
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-950 text-xs focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  ⚠️ This penalty will be immediately logged into Supabase and broadcasted across all mandis in the network.
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDelayModalBooking(null)}
                    className="flex-1 py-2.5 rounded-xl border border-primary-200 text-primary-800 font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelay}
                    disabled={loggingDelay}
                    className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-sm shadow-md disabled:opacity-50"
                  >
                    {loggingDelay ? 'Logging...' : 'Confirm Penalty'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: INSPECT SPECIFIC FARMER DELAYS */}
        {inspectPhone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-primary-200 overflow-hidden relative animate-in zoom-in-95">
              <div className="bg-primary-900 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setInspectPhone(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  Network Audit Record
                </div>
                <h3 className="display-font text-2xl font-bold mt-1 text-white">
                  Delay History: +91 {inspectPhone}
                </h3>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto space-y-3">
                {inspectDelays.length === 0 ? (
                  <p className="text-xs text-primary-600 text-center py-4">No penalties on record.</p>
                ) : (
                  inspectDelays.map((d) => (
                    <div key={d.id} className="p-3.5 rounded-xl bg-primary-50 border border-primary-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-primary-950 mb-1">
                        <span>{d.mandi_name}</span>
                        <span className="text-red-700 uppercase font-extrabold">{d.delay_type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-primary-700">{d.reason}</p>
                      <div className="flex justify-between text-[10px] text-primary-500 mt-2">
                        <span>Delay: {d.delay_minutes} mins</span>
                        <span>{new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: SUPABASE SQL SCHEMA VIEWER */}
        {schemaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-primary-200 overflow-hidden relative animate-in zoom-in-95">
              <div className="bg-primary-950 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setSchemaModalOpen(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Supabase Schema Migration
                </div>
                <h3 className="display-font text-2xl font-bold mt-1 text-white">Database Setup SQL</h3>
                <p className="text-xs text-primary-300 mt-1">
                  Run this in your Supabase SQL Editor to initialize tables, RLS policies, and realtime publications.
                </p>
              </div>

              <div className="p-6">
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-primary-900 text-emerald-300 font-mono text-xs max-h-72 overflow-y-auto overflow-x-auto">
{`-- KISAN MITRA SUPABASE SCHEMA
CREATE TABLE IF NOT EXISTS mandis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  slot_capacity INTEGER DEFAULT 6,
  opening_time TIME DEFAULT '06:00',
  closing_time TIME DEFAULT '18:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slot_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number TEXT NOT NULL,
  mandi_id UUID REFERENCES mandis(id),
  mandi_name TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  farmer_phone TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  quantity_quintals NUMERIC DEFAULT 10,
  vehicle_number TEXT,
  booking_date DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  slot_end_time TIME NOT NULL,
  status TEXT DEFAULT 'waiting',
  is_walkin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS farmer_delays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES slot_bookings(id),
  farmer_phone TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  mandi_id UUID REFERENCES mandis(id),
  mandi_name TEXT NOT NULL,
  delay_type TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  penalty_points INTEGER DEFAULT 1,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER PUBLICATION supabase_realtime ADD TABLE slot_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE farmer_delays;
ALTER PUBLICATION supabase_realtime ADD TABLE mandis;`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS mandis (...);`);
                      setCopiedSchema(true);
                      setTimeout(() => setCopiedSchema(false), 2000);
                    }}
                    className="absolute top-3 right-3 text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedSchema ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSchemaModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-primary-900 text-white font-bold text-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
