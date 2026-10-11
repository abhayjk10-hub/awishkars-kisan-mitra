-- =====================================================================
-- KISAN MITRA — SUPABASE DATABASE SCHEMA FOR APMC MANDI & SLOT SYSTEM
-- =====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. MANDIS TABLE (APMC Market Yards)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mandis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- e.g., 'APMC-PUN-01'
  license_no TEXT,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  slot_capacity INTEGER NOT NULL DEFAULT 5, -- farmers handled per 30-min window
  opening_time TIME NOT NULL DEFAULT '06:00',
  closing_time TIME NOT NULL DEFAULT '18:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for geographic and code lookups
CREATE INDEX IF NOT EXISTS idx_mandis_code ON mandis(code);
CREATE INDEX IF NOT EXISTS idx_mandis_district ON mandis(district);
CREATE INDEX IF NOT EXISTS idx_mandis_active ON mandis(is_active);

-- ---------------------------------------------------------------------
-- 2. SLOT BOOKINGS TABLE (Farmer 30-Minute Tokens)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS slot_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number TEXT NOT NULL, -- e.g. 'TK-PUN-0910-001'
  mandi_id UUID NOT NULL REFERENCES mandis(id) ON DELETE CASCADE,
  mandi_name TEXT NOT NULL,
  farmer_id UUID,
  farmer_name TEXT NOT NULL,
  farmer_phone TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  quantity_quintals NUMERIC NOT NULL DEFAULT 10,
  vehicle_number TEXT,
  booking_date DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  slot_end_time TIME NOT NULL, -- exactly 30 minutes after start_time
  status TEXT NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'active', 'completed', 'no-show', 'cancelled', 'waitlisted')),
  waitlist_position INTEGER DEFAULT NULL,
  cancellation_reason TEXT DEFAULT NULL,
  cancelled_at TIMESTAMPTZ DEFAULT NULL,
  is_walkin BOOLEAN NOT NULL DEFAULT false,
  arrival_time TIMESTAMPTZ,
  completion_time TIMESTAMPTZ,
  delay_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queue sorting and farmer history
CREATE INDEX IF NOT EXISTS idx_slot_bookings_mandi_date ON slot_bookings(mandi_id, booking_date, slot_start_time);
CREATE INDEX IF NOT EXISTS idx_slot_bookings_status ON slot_bookings(status);
CREATE INDEX IF NOT EXISTS idx_slot_bookings_farmer_phone ON slot_bookings(farmer_phone);
CREATE INDEX IF NOT EXISTS idx_slot_bookings_token ON slot_bookings(token_number);

-- ---------------------------------------------------------------------
-- 3. FARMER DELAYS & PENALTIES TABLE (Cross-Mandi Network Accountability)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmer_delays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES slot_bookings(id) ON DELETE SET NULL,
  farmer_phone TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  mandi_id UUID REFERENCES mandis(id) ON DELETE SET NULL,
  mandi_name TEXT NOT NULL,
  delay_type TEXT NOT NULL CHECK (delay_type IN ('late_arrival', 'no_show', 'cancellation_late')),
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  penalty_points INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  reported_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookup of repeat offenders across the network
CREATE INDEX IF NOT EXISTS idx_farmer_delays_phone ON farmer_delays(farmer_phone);
CREATE INDEX IF NOT EXISTS idx_farmer_delays_mandi ON farmer_delays(mandi_id);
CREATE INDEX IF NOT EXISTS idx_farmer_delays_type ON farmer_delays(delay_type);

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------
ALTER TABLE mandis ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_delays ENABLE ROW LEVEL SECURITY;

-- Mandis: Everyone can read active mandis (for discovery); authenticated or registered can insert
DROP POLICY IF EXISTS "Public can view active mandis" ON mandis;
CREATE POLICY "Public can view active mandis" ON mandis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert mandi" ON mandis;
CREATE POLICY "Anyone can insert mandi" ON mandis FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update mandi" ON mandis;
CREATE POLICY "Anyone can update mandi" ON mandis FOR UPDATE USING (true);

-- Slot Bookings: Allow farmer & mandi reads, inserts, and updates
DROP POLICY IF EXISTS "Public can read slot bookings" ON slot_bookings;
CREATE POLICY "Public can read slot bookings" ON slot_bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert slot bookings" ON slot_bookings;
CREATE POLICY "Public can insert slot bookings" ON slot_bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update slot bookings" ON slot_bookings;
CREATE POLICY "Public can update slot bookings" ON slot_bookings FOR UPDATE USING (true);

-- Farmer Delays: Visible across all mandis for network accountability
DROP POLICY IF EXISTS "Public can read farmer delays" ON farmer_delays;
CREATE POLICY "Public can read farmer delays" ON farmer_delays FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert farmer delays" ON farmer_delays;
CREATE POLICY "Public can insert farmer delays" ON farmer_delays FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 4. FARMERS PROFILE TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  village TEXT,
  district TEXT,
  state TEXT DEFAULT 'Maharashtra',
  land_plot_id TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view farmers" ON farmers;
CREATE POLICY "Public can view farmers" ON farmers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can insert farmers" ON farmers;
CREATE POLICY "Public can insert farmers" ON farmers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update farmers" ON farmers;
CREATE POLICY "Public can update farmers" ON farmers FOR UPDATE USING (true);


-- ---------------------------------------------------------------------
-- 5. ENABLE SUPABASE REALTIME FOR LIVE BIDIRECTIONAL SYNC
-- ---------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE slot_bookings;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE farmer_delays;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE mandis;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ---------------------------------------------------------------------
-- 6. SEED DATA: MAHARASHTRA APMC MANDIS (WITH GEOGRAPHIC COORDINATES)
-- ---------------------------------------------------------------------
INSERT INTO mandis (id, name, code, license_no, district, state, address, latitude, longitude, contact_person, contact_phone, contact_email, slot_capacity, opening_time, closing_time)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    'Pune APMC Market Yard',
    'APMC-PUN-01',
    'LIC-MH-PUN-2024-001',
    'Pune',
    'Maharashtra',
    'Gultekdi Market Yard, Pune, Maharashtra 411037',
    18.4907,
    73.8683,
    'Suresh Patil (Secretary)',
    '+919822012345',
    'pune.apmc@kisanmitra.gov.in',
    6,
    '06:00',
    '18:00'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-222222222222',
    'Baramati APMC Yard',
    'APMC-BRM-02',
    'LIC-MH-BRM-2024-089',
    'Pune',
    'Maharashtra',
    'MIDC Road, Baramati, District Pune 413133',
    18.1517,
    74.5772,
    'Rajendra Deshmukh',
    '+919822054321',
    'baramati.apmc@kisanmitra.gov.in',
    5,
    '06:30',
    '17:30'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-333333333333',
    'Ahmednagar APMC Main Yard',
    'APMC-AHM-03',
    'LIC-MH-AHM-2024-042',
    'Ahmednagar',
    'Maharashtra',
    'Station Road, Near Railway Goods Shed, Ahmednagar 414001',
    19.0948,
    74.7480,
    'Vikas Gaikwad',
    '+919823198765',
    'ahmednagar.apmc@kisanmitra.gov.in',
    8,
    '06:00',
    '19:00'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-444444444444',
    'Nashik APMC Onion & Grain Yard',
    'APMC-NSK-04',
    'LIC-MH-NSK-2024-118',
    'Nashik',
    'Maharashtra',
    'Peth Road, Panchavati, Nashik 422003',
    20.0125,
    73.7915,
    'Bhausaheb Jadhav',
    '+919822456789',
    'nashik.apmc@kisanmitra.gov.in',
    10,
    '05:30',
    '19:30'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-555555555555',
    'Lasalgaon APMC (Asia Largest Onion Yard)',
    'APMC-LSG-05',
    'LIC-MH-LSG-2024-007',
    'Nashik',
    'Maharashtra',
    'Niphad Taluka, Lasalgaon 422306',
    20.1458,
    74.2287,
    'Dattatray Shinde',
    '+919822998877',
    'lasalgaon.apmc@kisanmitra.gov.in',
    12,
    '06:00',
    '18:00'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-666666666666',
    'Solapur Cotton & Pulse Yard',
    'APMC-SOL-06',
    'LIC-MH-SOL-2024-054',
    'Solapur',
    'Maharashtra',
    'Saat Rasta, Siddheshwar Peth, Solapur 413001',
    17.6599,
    75.9064,
    'Anil Kulkarni',
    '+919823334455',
    'solapur.apmc@kisanmitra.gov.in',
    6,
    '07:00',
    '18:00'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-777777777777',
    'Kolhapur Jaggery & Spice APMC',
    'APMC-KOL-07',
    'LIC-MH-KOL-2024-019',
    'Kolhapur',
    'Maharashtra',
    'Shahupuri, Near Old Palace, Kolhapur 416001',
    16.7050,
    74.2433,
    'Mahadev Bhosale',
    '+919823901234',
    'kolhapur.apmc@kisanmitra.gov.in',
    5,
    '06:30',
    '17:30'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-888888888888',
    'Nagpur Orange & Grain Yard',
    'APMC-NGP-08',
    'LIC-MH-NGP-2024-093',
    'Nagpur',
    'Maharashtra',
    'Kalamna Market, Central Avenue, Nagpur 440008',
    21.1685,
    79.1389,
    'Pravin Wankhede',
    '+919822887766',
    'nagpur.apmc@kisanmitra.gov.in',
    8,
    '06:00',
    '19:00'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;
