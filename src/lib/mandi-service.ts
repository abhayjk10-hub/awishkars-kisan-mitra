import { createClient } from './supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Mandi, SlotBooking, FarmerDelay, SlotStatus, MandiRegistrationInput, MandiSession } from '@/types';
export type { Mandi };

// Default seed mandis (Maharashtra APMC Market Yards with real coordinates)
export const DEFAULT_MANDIS: Mandi[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-111111111111',
    name: 'Pune APMC Market Yard',
    code: 'APMC-PUN-01',
    license_no: 'LIC-MH-PUN-2024-001',
    district: 'Pune',
    state: 'Maharashtra',
    address: 'Gultekdi Market Yard, Pune, Maharashtra 411037',
    latitude: 18.4907,
    longitude: 73.8683,
    contact_person: 'Suresh Patil (Secretary)',
    contact_phone: '+919822012345',
    contact_email: 'pune.apmc@kisanmitra.gov.in',
    slot_capacity: 6,
    opening_time: '06:00',
    closing_time: '18:00',
    is_active: true,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-222222222222',
    name: 'Baramati APMC Yard',
    code: 'APMC-BRM-02',
    license_no: 'LIC-MH-BRM-2024-089',
    district: 'Pune',
    state: 'Maharashtra',
    address: 'MIDC Road, Baramati, District Pune 413133',
    latitude: 18.1517,
    longitude: 74.5772,
    contact_person: 'Rajendra Deshmukh',
    contact_phone: '+919822054321',
    contact_email: 'baramati.apmc@kisanmitra.gov.in',
    slot_capacity: 5,
    opening_time: '06:30',
    closing_time: '17:30',
    is_active: true,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-333333333333',
    name: 'Ahmednagar APMC Main Yard',
    code: 'APMC-AHM-03',
    license_no: 'LIC-MH-AHM-2024-042',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    address: 'Station Road, Near Railway Goods Shed, Ahmednagar 414001',
    latitude: 19.0948,
    longitude: 74.7480,
    contact_person: 'Vikas Gaikwad',
    contact_phone: '+919823198765',
    contact_email: 'ahmednagar.apmc@kisanmitra.gov.in',
    slot_capacity: 8,
    opening_time: '06:00',
    closing_time: '19:00',
    is_active: true,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-444444444444',
    name: 'Nashik APMC Onion & Grain Yard',
    code: 'APMC-NSK-04',
    license_no: 'LIC-MH-NSK-2024-118',
    district: 'Nashik',
    state: 'Maharashtra',
    address: 'Peth Road, Panchavati, Nashik 422003',
    latitude: 20.0125,
    longitude: 73.7915,
    contact_person: 'Bhausaheb Jadhav',
    contact_phone: '+919822456789',
    contact_email: 'nashik.apmc@kisanmitra.gov.in',
    slot_capacity: 10,
    opening_time: '05:30',
    closing_time: '19:30',
    is_active: true,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-555555555555',
    name: 'Lasalgaon APMC (Asia Largest Onion Yard)',
    code: 'APMC-LSG-05',
    license_no: 'LIC-MH-LSG-2024-007',
    district: 'Nashik',
    state: 'Maharashtra',
    address: 'Niphad Taluka, Lasalgaon 422306',
    latitude: 20.1458,
    longitude: 74.2287,
    contact_person: 'Dattatray Shinde',
    contact_phone: '+919822998877',
    contact_email: 'lasalgaon.apmc@kisanmitra.gov.in',
    slot_capacity: 12,
    opening_time: '06:00',
    closing_time: '18:00',
    is_active: true,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-666666666666',
    name: 'Solapur Cotton & Pulse Yard',
    code: 'APMC-SOL-06',
    license_no: 'LIC-MH-SOL-2024-054',
    district: 'Solapur',
    state: 'Maharashtra',
    address: 'Saat Rasta, Siddheshwar Peth, Solapur 413001',
    latitude: 17.6599,
    longitude: 75.9064,
    contact_person: 'Anil Kulkarni',
    contact_phone: '+919823334455',
    contact_email: 'solapur.apmc@kisanmitra.gov.in',
    slot_capacity: 6,
    opening_time: '07:00',
    closing_time: '18:00',
    is_active: true,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-777777777777',
    name: 'Kolhapur Jaggery & Spice APMC',
    code: 'APMC-KOL-07',
    license_no: 'LIC-MH-KOL-2024-019',
    district: 'Kolhapur',
    state: 'Maharashtra',
    address: 'Shahupuri, Near Old Palace, Kolhapur 416001',
    latitude: 16.7050,
    longitude: 74.2433,
    contact_person: 'Mahadev Bhosale',
    contact_phone: '+919823901234',
    contact_email: 'kolhapur.apmc@kisanmitra.gov.in',
    slot_capacity: 5,
    opening_time: '06:30',
    closing_time: '17:30',
    is_active: true,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-888888888888',
    name: 'Nagpur Orange & Grain Yard',
    code: 'APMC-NGP-08',
    license_no: 'LIC-MH-NGP-2024-093',
    district: 'Nagpur',
    state: 'Maharashtra',
    address: 'Kalamna Market, Central Avenue, Nagpur 440008',
    latitude: 21.1685,
    longitude: 79.1389,
    contact_person: 'Pravin Wankhede',
    contact_phone: '+919822887766',
    contact_email: 'nagpur.apmc@kisanmitra.gov.in',
    slot_capacity: 8,
    opening_time: '06:00',
    closing_time: '19:00',
    is_active: true,
  },
];

// Haversine formula to compute great-circle distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Local cache keys
const STORAGE_BOOKINGS = 'km_slot_bookings';
const STORAGE_MANDIS = 'km_registered_mandis';
const STORAGE_DELAYS = 'km_farmer_delays';
const STORAGE_MANDI_SESSION = 'km_mandi_session';

// Cross-tab broadcast channel for instantaneous zero-latency sync
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('km_mandi_sync');
  } catch {
    // BroadcastChannel unsupported or restricted
  }
}

function notifyBroadcast(type: string, payload: unknown) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('km_sync_event', { detail: { type, payload } }));
  }
}

// Helper: read local cache
function getLocalCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Helper: write local cache
function setLocalCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * MANDI DISCOVERY & RETRIEVAL
 * ───────────────────────────────────────────────────────────────────────── */
export async function getMandis(userLat?: number, userLng?: number): Promise<Mandi[]> {
  const supabase = createClient();
  let list: Mandi[] = [];

  try {
    const { data, error } = await supabase
      .from('mandis')
      .select('*')
      .eq('is_active', true);

    if (!error && data && data.length > 0) {
      list = data as Mandi[];
    }
  } catch {
    // Fallback to local
  }

  // Merge with locally registered custom mandis
  const localMandis = getLocalCache<Mandi[]>(STORAGE_MANDIS, []);
  if (list.length === 0) {
    list = [...DEFAULT_MANDIS];
  }

  // Append any local custom ones not in list
  for (const lm of localMandis) {
    if (!list.some((m) => m.id === lm.id || m.code === lm.code)) {
      list.push(lm);
    }
  }

  // If user coordinates provided, compute distance and sort
  if (userLat !== undefined && userLng !== undefined) {
    list = list.map((m) => ({
      ...m,
      distance_km: calculateDistanceKm(userLat, userLng, m.latitude, m.longitude),
    }));
    list.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
  }

  return list;
}

export async function getMandiById(mandiId: string): Promise<Mandi | null> {
  const mandis = await getMandis();
  return mandis.find((m) => m.id === mandiId || m.code === mandiId) || null;
}

/* ─────────────────────────────────────────────────────────────────────────
 * MANDI REGISTRATION & AUTH
 * ───────────────────────────────────────────────────────────────────────── */
export async function registerMandi(input: MandiRegistrationInput): Promise<{ mandi: Mandi; error?: string }> {
  const newMandi: Mandi = {
    id: 'mandi-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    license_no: input.license_no?.trim(),
    district: input.district.trim(),
    state: input.state.trim() || 'Maharashtra',
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    contact_person: input.contact_person.trim(),
    contact_phone: input.contact_phone.trim(),
    contact_email: input.contact_email.trim(),
    slot_capacity: input.slot_capacity || 6,
    opening_time: input.opening_time || '06:00',
    closing_time: input.closing_time || '18:00',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase.from('mandis').insert(newMandi).select().single();
    if (!error && data) {
      // successful remote write
    }
  } catch {
    // fallback
  }

  // Always save locally so login immediately works
  const current = getLocalCache<Mandi[]>(STORAGE_MANDIS, []);
  current.push(newMandi);
  setLocalCache(STORAGE_MANDIS, current);

  // Auto sign in to session
  const session: MandiSession = {
    mandi: newMandi,
    loggedInAt: new Date().toISOString(),
  };
  setLocalCache(STORAGE_MANDI_SESSION, session);
  notifyBroadcast('MANDI_REGISTERED', newMandi);

  return { mandi: newMandi };
}

export async function loginMandi(identifier: string, _password?: string): Promise<{ session: MandiSession | null; error?: string }> {
  const mandis = await getMandis();
  const clean = identifier.trim().toLowerCase();
  const matched = mandis.find(
    (m) =>
      m.code.toLowerCase() === clean ||
      m.id.toLowerCase() === clean ||
      m.name.toLowerCase().includes(clean) ||
      m.contact_email?.toLowerCase() === clean ||
      m.contact_phone?.includes(clean)
  );

  if (!matched) {
    return { session: null, error: `No registered mandi found with code, email, or name matching "${identifier}".` };
  }

  const session: MandiSession = {
    mandi: matched,
    loggedInAt: new Date().toISOString(),
  };
  setLocalCache(STORAGE_MANDI_SESSION, session);
  notifyBroadcast('MANDI_LOGGED_IN', session);

  return { session };
}

export function getCurrentMandiSession(): MandiSession | null {
  return getLocalCache<MandiSession | null>(STORAGE_MANDI_SESSION, null);
}

export function logoutMandi(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_MANDI_SESSION);
    } catch {
      // ignore
    }
    notifyBroadcast('MANDI_LOGGED_OUT', null);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * TOKEN GENERATION (30-MIN WINDOWS)
 * ───────────────────────────────────────────────────────────────────────── */
export function generateSlotTimes(openingTime = '06:00', closingTime = '18:00'): { start: string; end: string; label: string }[] {
  const [openH, openM] = openingTime.split(':').map(Number);
  const [closeH, closeM] = closingTime.split(':').map(Number);

  let currentMinutes = (isNaN(openH) ? 6 : openH) * 60 + (isNaN(openM) ? 0 : openM);
  const endMinutes = (isNaN(closeH) ? 18 : closeH) * 60 + (isNaN(closeM) ? 0 : closeM);

  const slots: { start: string; end: string; label: string }[] = [];

  while (currentMinutes + 30 <= endMinutes) {
    const sH = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
    const sM = String(currentMinutes % 60).padStart(2, '0');
    const nextMinutes = currentMinutes + 30;
    const eH = String(Math.floor(nextMinutes / 60)).padStart(2, '0');
    const eM = String(nextMinutes % 60).padStart(2, '0');

    slots.push({
      start: `${sH}:${sM}`,
      end: `${eH}:${eM}`,
      label: `${sH}:${sM} – ${eH}:${eM}`,
    });

    currentMinutes += 30;
  }

  return slots;
}

export function generateTokenNumber(mandiCode: string, date: string, seq: number): string {
  const cleanCode = mandiCode.replace(/[^A-Za-z0-9]/g, '').slice(-3).toUpperCase() || 'MND';
  const cleanDate = date.replace(/-/g, '').slice(4); // MMDD
  const paddedSeq = String(seq).padStart(3, '0');
  return `TK-${cleanCode}-${cleanDate}-${paddedSeq}`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * SLOT BOOKING (FARMER SIDE)
 * ───────────────────────────────────────────────────────────────────────── */
export interface CreateSlotBookingInput {
  mandi_id: string;
  mandi_name: string;
  farmer_id?: string;
  farmer_name: string;
  farmer_phone: string;
  crop_name: string;
  quantity_quintals: number;
  vehicle_number?: string;
  booking_date: string;
  slot_start_time: string;
  slot_end_time?: string;
  is_walkin?: boolean;
}

export async function createSlotBooking(input: CreateSlotBookingInput): Promise<{ booking: SlotBooking; error?: string }> {
  // Compute end time: start + 30 mins
  let endTime = input.slot_end_time;
  if (!endTime) {
    const [h, m] = input.slot_start_time.split(':').map(Number);
    const totalMin = h * 60 + m + 30;
    endTime = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  }

  // Get current bookings to determine sequence and capacity
  const existing = await getMandiQueue(input.mandi_id, input.booking_date);
  const seq = existing.length + 1;
  const tokenNumber = generateTokenNumber(input.mandi_id, input.booking_date, seq);

  // Check capacity for this specific 30-min window
  const mandi = await getMandiById(input.mandi_id);
  const capacity = mandi?.slot_capacity || 6;
  const activeInSlot = existing.filter(
    (b) => b.slot_start_time === input.slot_start_time && (b.status === 'waiting' || b.status === 'active')
  );

  const isFull = activeInSlot.length >= capacity;
  const initialStatus: SlotStatus = isFull ? 'waitlisted' : 'waiting';
  const waitlistPos = isFull
    ? existing.filter((b) => b.slot_start_time === input.slot_start_time && b.status === 'waitlisted').length + 1
    : undefined;

  const newBooking: SlotBooking = {
    id: 'booking-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8),
    token_number: tokenNumber,
    mandi_id: input.mandi_id,
    mandi_name: input.mandi_name,
    farmer_id: input.farmer_id,
    farmer_name: input.farmer_name.trim(),
    farmer_phone: input.farmer_phone.trim(),
    crop_name: input.crop_name.trim(),
    quantity_quintals: Number(input.quantity_quintals) || 10,
    vehicle_number: input.vehicle_number?.trim().toUpperCase() || undefined,
    booking_date: input.booking_date,
    slot_start_time: input.slot_start_time,
    slot_end_time: endTime,
    status: initialStatus,
    waitlist_position: waitlistPos,
    is_walkin: Boolean(input.is_walkin),
    created_at: new Date().toISOString(),
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase.from('slot_bookings').insert(newBooking).select().single();
    if (!error && data) {
      // Remote write succeeded
    }
  } catch {
    // Offline or schema pending
  }

  // Save to local cache
  const localList = getLocalCache<SlotBooking[]>(STORAGE_BOOKINGS, []);
  localList.push(newBooking);
  setLocalCache(STORAGE_BOOKINGS, localList);

  // Broadcast to Mandi dashboard immediately
  notifyBroadcast('SLOT_BOOKED', newBooking);

  return { booking: newBooking };
}

/* ─────────────────────────────────────────────────────────────────────────
 * MANUAL PHYSICAL TOKEN REGISTRATION (WALK-IN GATE ENTRY)
 * ───────────────────────────────────────────────────────────────────────── */
export async function createWalkinToken(
  mandiId: string,
  data: {
    farmer_name: string;
    farmer_phone: string;
    crop_name: string;
    quantity_quintals: number;
    vehicle_number?: string;
  }
): Promise<{ booking: SlotBooking; error?: string }> {
  const mandi = await getMandiById(mandiId);
  const mandiName = mandi?.name || 'APMC Yard';

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Round up to current or next 30-min window
  const roundedMin = Math.floor(currentMinutes / 30) * 30;
  const sH = String(Math.floor(roundedMin / 60)).padStart(2, '0');
  const sM = String(roundedMin % 60).padStart(2, '0');
  const startTime = `${sH}:${sM}`;

  return createSlotBooking({
    mandi_id: mandiId,
    mandi_name: mandiName,
    farmer_name: data.farmer_name,
    farmer_phone: data.farmer_phone,
    crop_name: data.crop_name,
    quantity_quintals: data.quantity_quintals,
    vehicle_number: data.vehicle_number,
    booking_date: todayStr,
    slot_start_time: startTime,
    is_walkin: true,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
 * MANDI QUEUE & STATUS MANAGEMENT
 * ───────────────────────────────────────────────────────────────────────── */
export async function getMandiQueue(mandiId: string, date?: string): Promise<SlotBooking[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const supabase = createClient();
  let list: SlotBooking[] = [];

  try {
    let query = supabase
      .from('slot_bookings')
      .select('*')
      .eq('mandi_id', mandiId);

    if (targetDate) {
      query = query.eq('booking_date', targetDate);
    }

    const { data, error } = await query.order('slot_start_time', { ascending: true });
    if (!error && data) {
      list = data as SlotBooking[];
    }
  } catch {
    // fallback
  }

  // Merge with local cache
  const localList = getLocalCache<SlotBooking[]>(STORAGE_BOOKINGS, []);
  const matchingLocal = localList.filter((b) => b.mandi_id === mandiId && (!targetDate || b.booking_date === targetDate));

  for (const item of matchingLocal) {
    const idx = list.findIndex((b) => b.id === item.id || b.token_number === item.token_number);
    if (idx === -1) {
      list.push(item);
    } else {
      // Prioritize freshest status
      if (item.status !== list[idx].status) {
        list[idx] = item;
      }
    }
  }

  // Sort by start time, then created_at
  list.sort((a, b) => a.slot_start_time.localeCompare(b.slot_start_time) || a.created_at.localeCompare(b.created_at));

  return list;
}

export async function updateTokenStatus(
  bookingId: string,
  newStatus: SlotStatus,
  options?: {
    delay_minutes?: number;
    reason?: string;
    reported_by?: string;
    penalty_points?: number;
  }
): Promise<{ success: boolean; booking?: SlotBooking; error?: string }> {
  const nowIso = new Date().toISOString();
  const updateFields: Partial<SlotBooking> = {
    status: newStatus,
  };

  if (newStatus === 'active') {
    updateFields.arrival_time = nowIso;
  } else if (newStatus === 'completed') {
    updateFields.completion_time = nowIso;
  } else if (newStatus === 'no-show') {
    updateFields.delay_minutes = options?.delay_minutes ?? 30;
  }

  const supabase = createClient();
  try {
    await supabase.from('slot_bookings').update(updateFields).eq('id', bookingId);
  } catch {
    // fallback
  }

  // Update in local cache
  const localList = getLocalCache<SlotBooking[]>(STORAGE_BOOKINGS, []);
  const index = localList.findIndex((b) => b.id === bookingId);
  let updatedBooking: SlotBooking | undefined;

  if (index !== -1) {
    localList[index] = {
      ...localList[index],
      ...updateFields,
    };
    updatedBooking = localList[index];
    setLocalCache(STORAGE_BOOKINGS, localList);
  }

  // If status is 'no-show' or delay logged, write to cross-mandi farmer_delays table
  if (newStatus === 'no-show' || (options?.delay_minutes && options.delay_minutes > 0)) {
    const booking = updatedBooking || localList.find((b) => b.id === bookingId);
    if (booking) {
      await logFarmerDelay({
        booking_id: booking.id,
        farmer_phone: booking.farmer_phone,
        farmer_name: booking.farmer_name,
        mandi_id: booking.mandi_id,
        mandi_name: booking.mandi_name,
        delay_type: newStatus === 'no-show' ? 'no_show' : 'late_arrival',
        delay_minutes: options?.delay_minutes || 30,
        penalty_points: options?.penalty_points || (newStatus === 'no-show' ? 2 : 1),
        reason: options?.reason || (newStatus === 'no-show' ? 'Farmer did not arrive for allocated 30-min window' : 'Delayed arrival at market yard gate'),
        reported_by: options?.reported_by || 'APMC Gate Officer',
      });
    }
  }

  // If status is 'no-show' or 'cancelled', vacate slot and automatically promote next waitlisted farmer
  let promotedBooking: SlotBooking | null = null;
  if ((newStatus === 'no-show' || newStatus === 'cancelled') && (updatedBooking || localList.find((b) => b.id === bookingId))) {
    const target = updatedBooking || localList.find((b) => b.id === bookingId);
    if (target) {
      promotedBooking = await promoteNextWaitlistedFarmer(target.mandi_id, target.booking_date, target.slot_start_time);
    }
  }

  // Broadcast token update
  notifyBroadcast('TOKEN_STATUS_UPDATED', { bookingId, status: newStatus, booking: updatedBooking, promotedBooking });

  return { success: true, booking: updatedBooking };
}

/* ─────────────────────────────────────────────────────────────────────────
 * FARMER-SIDE SLOT CANCELLATION & WAITLIST AUTOMATION
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Validates whether a slot booking is eligible for cancellation.
 * STRICT RULE: Farmer can cancel ONLY up to one day before the slot date.
 * Same-day or past cancellations are strictly blocked.
 */
export function canCancelSlotBooking(bookingDate: string): { allowed: boolean; reasonKey?: string; message: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = bookingDate.split('-').map(Number);
  const slotDate = new Date(y, m - 1, d);
  slotDate.setHours(0, 0, 0, 0);

  const diffMs = slotDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      allowed: false,
      reasonKey: 'slot.cancellationBlockedSameDay',
      message: 'Cancellations are only allowed up to 1 day before the scheduled slot date. Cancellations on the slot date or later are locked to maintain orderly APMC yard weighbridge operations.',
    };
  }

  return {
    allowed: true,
    message: 'Eligible for cancellation.',
  };
}

/**
 * Promotes the next waitlisted farmer for a vacated slot.
 */
export async function promoteNextWaitlistedFarmer(
  mandiId: string,
  bookingDate: string,
  slotStartTime: string
): Promise<SlotBooking | null> {
  const supabase = createClient();
  let promotedBooking: SlotBooking | null = null;

  try {
    // 1. Try PostgreSQL function if available in database
    const { data: rpcPromotedId } = await supabase.rpc('promote_next_waitlisted_farmer', {
      p_mandi_id: mandiId,
      p_booking_date: bookingDate,
      p_slot_start_time: slotStartTime,
    });

    if (rpcPromotedId) {
      const { data } = await supabase.from('slot_bookings').select('*').eq('id', rpcPromotedId).single();
      if (data) promotedBooking = data as SlotBooking;
    } else {
      // 2. Direct query fallback
      const { data: waitlisted } = await supabase
        .from('slot_bookings')
        .select('*')
        .eq('mandi_id', mandiId)
        .eq('booking_date', bookingDate)
        .eq('slot_start_time', slotStartTime)
        .eq('status', 'waitlisted')
        .order('waitlist_position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .limit(1);

      if (waitlisted && waitlisted.length > 0) {
        const target = waitlisted[0];
        const { data: updated } = await supabase
          .from('slot_bookings')
          .update({ status: 'waiting', waitlist_position: null })
          .eq('id', target.id)
          .select()
          .single();
        if (updated) promotedBooking = updated as SlotBooking;
      }
    }
  } catch {
    // Supabase query fallback handled below
  }

  // 3. Update local cache
  const localList = getLocalCache<SlotBooking[]>(STORAGE_BOOKINGS, []);
  const waitlistIndex = localList.findIndex(
    (b) =>
      b.mandi_id === mandiId &&
      b.booking_date === bookingDate &&
      b.slot_start_time === slotStartTime &&
      b.status === 'waitlisted'
  );

  if (waitlistIndex !== -1) {
    localList[waitlistIndex] = {
      ...localList[waitlistIndex],
      status: 'waiting',
      waitlist_position: undefined,
    };
    if (!promotedBooking) {
      promotedBooking = localList[waitlistIndex];
    }
    setLocalCache(STORAGE_BOOKINGS, localList);
  }

  if (promotedBooking) {
    notifyBroadcast('SLOT_PROMOTED', {
      booking: promotedBooking,
      farmerPhone: promotedBooking.farmer_phone,
      bookingId: promotedBooking.id,
    });
    notifyBroadcast('TOKEN_STATUS_UPDATED', {
      bookingId: promotedBooking.id,
      status: 'waiting',
      booking: promotedBooking,
    });
  }

  return promotedBooking;
}

/**
 * Cancels a farmer's slot booking with 1-day advance notice validation,
 * frees the slot in Supabase, and reassigns it to the next waitlisted farmer.
 */
export async function cancelSlotBooking(
  bookingId: string,
  reason: string = 'Cancelled by farmer'
): Promise<{ success: boolean; error?: string; booking?: SlotBooking; promotedBooking?: SlotBooking | null }> {
  const localList = getLocalCache<SlotBooking[]>(STORAGE_BOOKINGS, []);
  const localBooking = localList.find((b) => b.id === bookingId);

  const supabase = createClient();
  let bookingDate = localBooking?.booking_date;
  let targetMandiId = localBooking?.mandi_id;
  let targetSlotTime = localBooking?.slot_start_time;

  // Retrieve details from Supabase if not found locally
  if (!bookingDate) {
    try {
      const { data } = await supabase.from('slot_bookings').select('*').eq('id', bookingId).single();
      if (data) {
        bookingDate = data.booking_date;
        targetMandiId = data.mandi_id;
        targetSlotTime = data.slot_start_time;
      }
    } catch {
      // ignore
    }
  }

  if (!bookingDate) {
    return { success: false, error: 'Booking record not found.' };
  }

  // 1-Day rule check
  const check = canCancelSlotBooking(bookingDate);
  if (!check.allowed) {
    return { success: false, error: check.message };
  }

  const nowIso = new Date().toISOString();
  let updatedBooking: SlotBooking | undefined;

  // 1. Try Supabase RPC or direct update
  try {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('cancel_farmer_slot', {
      p_booking_id: bookingId,
      p_reason: reason,
    });

    if (rpcErr) {
      await supabase
        .from('slot_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: nowIso,
          cancellation_reason: reason,
        })
        .eq('id', bookingId);
    }
  } catch {
    // fallback
  }

  // 2. Update local cache
  const idx = localList.findIndex((b) => b.id === bookingId);
  if (idx !== -1) {
    localList[idx] = {
      ...localList[idx],
      status: 'cancelled',
      cancelled_at: nowIso,
      cancellation_reason: reason,
    };
    updatedBooking = localList[idx];
    setLocalCache(STORAGE_BOOKINGS, localList);
  }

  // 3. Automatically promote next waitlisted farmer for this exact slot
  let promotedBooking: SlotBooking | null = null;
  if (targetMandiId && bookingDate && targetSlotTime) {
    promotedBooking = await promoteNextWaitlistedFarmer(targetMandiId, bookingDate, targetSlotTime);
  }

  // 4. Notify all tabs & components
  notifyBroadcast('SLOT_CANCELLED', {
    bookingId,
    booking: updatedBooking,
    promotedBooking,
  });
  notifyBroadcast('TOKEN_STATUS_UPDATED', {
    bookingId,
    status: 'cancelled',
    booking: updatedBooking,
  });

  return { success: true, booking: updatedBooking, promotedBooking };
}

/**
 * Retrieves all bookings associated with a farmer's mobile number or user ID.
 */
export async function getFarmerBookings(phoneOrUserId: string): Promise<SlotBooking[]> {
  const cleanPhone = phoneOrUserId.replace(/\D/g, '').slice(-10);
  const supabase = createClient();
  let list: SlotBooking[] = [];

  try {
    let query = supabase.from('slot_bookings').select('*');
    if (cleanPhone) {
      query = query.or(`farmer_phone.eq.${phoneOrUserId},farmer_phone.ilike.%${cleanPhone}%,farmer_id.eq.${phoneOrUserId}`);
    } else {
      query = query.eq('farmer_id', phoneOrUserId);
    }

    const { data, error } = await query
      .order('booking_date', { ascending: false })
      .order('slot_start_time', { ascending: false });

    if (!error && data) {
      list = data as SlotBooking[];
    }
  } catch {
    // fallback
  }

  const localList = getLocalCache<SlotBooking[]>(STORAGE_BOOKINGS, []);
  for (const item of localList) {
    const matchPhone = cleanPhone && item.farmer_phone?.replace(/\D/g, '').slice(-10) === cleanPhone;
    const matchId = item.farmer_id === phoneOrUserId;
    if (matchPhone || matchId) {
      const existingIdx = list.findIndex((b) => b.id === item.id);
      if (existingIdx === -1) {
        list.push(item);
      } else {
        list[existingIdx] = item;
      }
    }
  }

  list.sort((a, b) => b.booking_date.localeCompare(a.booking_date) || b.slot_start_time.localeCompare(a.slot_start_time));
  return list;
}

/* ─────────────────────────────────────────────────────────────────────────
 * CROSS-MANDI FARMER DELAY & PENALTY TRACKING
 * ───────────────────────────────────────────────────────────────────────── */
export async function logFarmerDelay(input: Omit<FarmerDelay, 'id' | 'created_at'>): Promise<FarmerDelay> {
  const newDelay: FarmerDelay = {
    ...input,
    id: 'delay-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString(),
  };

  const supabase = createClient();
  try {
    await supabase.from('farmer_delays').insert(newDelay);
  } catch {
    // fallback
  }

  // Save to local cache
  const delays = getLocalCache<FarmerDelay[]>(STORAGE_DELAYS, []);
  delays.push(newDelay);
  setLocalCache(STORAGE_DELAYS, delays);

  notifyBroadcast('FARMER_DELAY_RECORDED', newDelay);
  return newDelay;
}

export async function getFarmerDelays(farmerPhone: string): Promise<FarmerDelay[]> {
  const cleanPhone = farmerPhone.replace(/\D/g, '').slice(-10);
  const supabase = createClient();
  let list: FarmerDelay[] = [];

  try {
    const { data, error } = await supabase
      .from('farmer_delays')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      list = data as FarmerDelay[];
    }
  } catch {
    // fallback
  }

  const localDelays = getLocalCache<FarmerDelay[]>(STORAGE_DELAYS, []);
  for (const ld of localDelays) {
    if (!list.some((d) => d.id === ld.id)) {
      list.push(ld);
    }
  }

  return list.filter((d) => d.farmer_phone.replace(/\D/g, '').slice(-10) === cleanPhone);
}

export async function getAllFarmerDelays(): Promise<FarmerDelay[]> {
  const supabase = createClient();
  let list: FarmerDelay[] = [];

  try {
    const { data, error } = await supabase
      .from('farmer_delays')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      list = data as FarmerDelay[];
    }
  } catch {
    // fallback
  }

  const localDelays = getLocalCache<FarmerDelay[]>(STORAGE_DELAYS, []);
  for (const ld of localDelays) {
    if (!list.some((d) => d.id === ld.id)) {
      list.push(ld);
    }
  }

  return list;
}

/* ─────────────────────────────────────────────────────────────────────────
 * REAL-TIME SUBSCRIPTIONS
 * ───────────────────────────────────────────────────────────────────────── */
type MandiQueueEvent = {
  type?: string;
  payload?: {
    mandi_id?: string;
    token_number?: SlotBooking['token_number'];
    farmer_name?: string;
    booking?: Partial<SlotBooking>;
    bookingId?: string;
  };
};

export function subscribeToMandiQueue(mandiId: string, onUpdate: (event: MandiQueueEvent) => void): () => void {
  const supabase = createClient();
  let supabaseSub: ReturnType<typeof supabase.channel> | null = null;

  try {
    supabaseSub = supabase
      .channel(`mandi_queue_${mandiId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slot_bookings',
          filter: `mandi_id=eq.${mandiId}`,
        },
        () => {
          onUpdate({});
        }
      )
      .subscribe();
  } catch {
    // ignore
  }

  // Cross-tab broadcast listener
  const handleBroadcast = (e: MessageEvent<MandiQueueEvent>) => {
    if (e.data?.payload?.mandi_id === mandiId || e.data?.type === 'TOKEN_STATUS_UPDATED') {
      onUpdate(e.data);
    }
  };

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent<MandiQueueEvent>).detail;
    if (detail?.payload?.mandi_id === mandiId || detail?.type === 'TOKEN_STATUS_UPDATED') {
      onUpdate(detail);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('km_sync_event', handleCustomEvent);
  }

  return () => {
    if (supabaseSub) {
      try {
        supabase.removeChannel(supabaseSub);
      } catch {
        // ignore
      }
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('km_sync_event', handleCustomEvent);
    }
  };
}

export function subscribeToFarmerBooking(bookingId: string, onUpdate: (booking: SlotBooking) => void): () => void {
  const supabase = createClient();
  let supabaseSub: ReturnType<typeof supabase.channel> | null = null;

  try {
    supabaseSub = supabase
      .channel(`farmer_booking_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'slot_bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.new) {
            onUpdate(payload.new as SlotBooking);
          }
        }
      )
      .subscribe();
  } catch {
    // ignore
  }

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data?.payload?.bookingId === bookingId && e.data?.payload?.booking) {
      onUpdate(e.data.payload.booking);
    }
  };

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.payload?.bookingId === bookingId && detail?.payload?.booking) {
      onUpdate(detail.payload.booking);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('km_sync_event', handleCustomEvent);
  }

  return () => {
    if (supabaseSub) {
      try {
        supabase.removeChannel(supabaseSub);
      } catch {
        // ignore
      }
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('km_sync_event', handleCustomEvent);
    }
  };
}
