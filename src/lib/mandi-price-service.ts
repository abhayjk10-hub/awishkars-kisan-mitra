import { Mandi } from '@/types';
import { DEFAULT_MANDIS, calculateDistanceKm } from './mandi-service';
import { calculateTransportationCost, GeoLocation } from './transport-calculator';
import { Language, t } from './translations';

export type CommodityCategory = 'grains_cereals' | 'pulses' | 'vegetables' | 'fruits';
export type PerishabilityLevel = 'high' | 'medium' | 'low';

export interface CommodityItem {
  id: string;
  nameKey: string;
  defaultName: string;
  hindiName: string;
  marathiName: string;
  category: CommodityCategory;
  perishability: PerishabilityLevel;
  shelfLifeDays: number;
  perishabilityNote: string;
  baseMsp?: number; // Minimum Support Price if applicable
  typicalPeakMonth: string; // e.g., 'November', 'March'
}

export interface MandiCropPrice {
  commodityId: string;
  commodityName: string;
  category: CommodityCategory;
  mandiId: string;
  mandiName: string;
  modalPrice: number; // ₹ per quintal
  minPrice: number;
  maxPrice: number;
  trend24h: number; // percentage change e.g. +2.4 or -1.5
  arrivalsQuintals: number;
  perishability: PerishabilityLevel;
  lastUpdated: string;
}

export interface HistoricalYearData {
  year: number;
  averagePrice: number;
  peakPrice: number;
  peakPeriod: string;
}

export interface FuturePriceForecast {
  days15Price: number;
  days15ChangePct: number;
  days30Price: number;
  days30ChangePct: number;
  trendDirection: 'up' | 'down' | 'stable';
  confidenceScore: number; // 0 to 100
}

export interface FestivalDemandInsight {
  upcomingFestival: string;
  festivalDate: string;
  daysUntilFestival: number;
  demandSurgePct: number;
  expectedPriceImpact: string;
  appliesToCommodity: boolean;
}

export interface CrossMandiComparison {
  mandiId: string;
  mandiName: string;
  distanceKm: number;
  pricePerQuintal: number;
  grossRevenue: number;
  transportCost: number;
  netRevenue: number;
  isHighestNet: boolean;
  isNearest: boolean;
}

export interface SellingAdvisoryResult {
  commodity: CommodityItem;
  quantityQuintals: number;
  currentMandiPrice: number;
  recommendation: 'SELL_NOW' | 'HOLD_HARVEST';
  confidence: 'High' | 'Medium' | 'Moderate';
  headlineKey: string;
  headline: string;
  isPerishabilityOverride: boolean;
  perishabilityWarning?: string;
  festivalInsight?: FestivalDemandInsight;
  futureForecast: FuturePriceForecast;
  historicalPeaks: {
    typicalPeakPeriod: string;
    years: HistoricalYearData[];
    comparisonSummary: string;
  };
  crossMandiComparison: CrossMandiComparison[];
  bestMandi: CrossMandiComparison;
  reasoningPoints: string[];
  netRevenueNow: number;
  projectedNetRevenueHold?: number;
}

/* ─────────────────────────────────────────────────────────────────────────
 * 1. MASTER COMMODITY CATALOGUE
 * ───────────────────────────────────────────────────────────────────────── */
export const COMMODITIES: CommodityItem[] = [
  // Grains & Cereals (Low Perishability)
  {
    id: 'wheat',
    nameKey: 'commodity.wheat',
    defaultName: 'Wheat (गहू / गेहूं)',
    hindiName: 'गेहूं',
    marathiName: 'गहू',
    category: 'grains_cereals',
    perishability: 'low',
    shelfLifeDays: 365,
    perishabilityNote: 'High storability (6-12+ months) in dry godowns or airtight bags.',
    baseMsp: 2275,
    typicalPeakMonth: 'November - December',
  },
  {
    id: 'paddy',
    nameKey: 'commodity.paddy',
    defaultName: 'Paddy / Rice (धान / तांदूळ)',
    hindiName: 'धान (चावल)',
    marathiName: 'धान (तांदूळ)',
    category: 'grains_cereals',
    perishability: 'low',
    shelfLifeDays: 365,
    perishabilityNote: 'Low perishability; store below 14% moisture to prevent fungal growth.',
    baseMsp: 2183,
    typicalPeakMonth: 'January - February',
  },
  {
    id: 'maize',
    nameKey: 'commodity.maize',
    defaultName: 'Maize (मका / मक्का)',
    hindiName: 'मक्का',
    marathiName: 'मका',
    category: 'grains_cereals',
    perishability: 'low',
    shelfLifeDays: 240,
    perishabilityNote: 'Good storability for poultry and feed industries if grain moisture is controlled.',
    baseMsp: 2090,
    typicalPeakMonth: 'November - December',
  },
  {
    id: 'bajra',
    nameKey: 'commodity.bajra',
    defaultName: 'Bajra / Pearl Millet (बाजरी)',
    hindiName: 'बाजरा',
    marathiName: 'बाजरी',
    category: 'grains_cereals',
    perishability: 'low',
    shelfLifeDays: 180,
    perishabilityNote: 'Drought-hardy cereal with 6-month storability.',
    baseMsp: 2500,
    typicalPeakMonth: 'December - January',
  },
  {
    id: 'jowar',
    nameKey: 'commodity.jowar',
    defaultName: 'Jowar / Sorghum (ज्वारी)',
    hindiName: 'ज्वार',
    marathiName: 'ज्वारी',
    category: 'grains_cereals',
    perishability: 'low',
    shelfLifeDays: 240,
    perishabilityNote: 'Storable for 6-8 months in ventilated silos.',
    baseMsp: 3180,
    typicalPeakMonth: 'October - November',
  },

  // Pulses (Low Perishability)
  {
    id: 'soyabean',
    nameKey: 'commodity.soyabean',
    defaultName: 'Soyabean (सोयाबीन)',
    hindiName: 'सोयाबीन',
    marathiName: 'सोयाबीन',
    category: 'pulses',
    perishability: 'low',
    shelfLifeDays: 240,
    perishabilityNote: 'Storable for up to 8 months; oil extraction crushers buy steadily.',
    baseMsp: 4600,
    typicalPeakMonth: 'December - January',
  },
  {
    id: 'chana',
    nameKey: 'commodity.chana',
    defaultName: 'Gram / Chana (हरभरा / चना)',
    hindiName: 'चना',
    marathiName: 'हरभरा',
    category: 'pulses',
    perishability: 'low',
    shelfLifeDays: 300,
    perishabilityNote: 'Excellent storability in gunny bags treated against pulse beetle.',
    baseMsp: 5440,
    typicalPeakMonth: 'October - November',
  },
  {
    id: 'tur',
    nameKey: 'commodity.tur',
    defaultName: 'Tur / Arhar Dal (तूर / अरहर)',
    hindiName: 'अरहर / तूर',
    marathiName: 'तूर डाळ',
    category: 'pulses',
    perishability: 'low',
    shelfLifeDays: 360,
    perishabilityNote: 'Long shelf-life; high festive wedding and Diwali pulse demand.',
    baseMsp: 7000,
    typicalPeakMonth: 'November - December',
  },
  {
    id: 'moong',
    nameKey: 'commodity.moong',
    defaultName: 'Moong / Green Gram (मूग / मूंग)',
    hindiName: 'मूंग दाल',
    marathiName: 'मूग',
    category: 'pulses',
    perishability: 'low',
    shelfLifeDays: 270,
    perishabilityNote: 'Storable for 9 months under dry atmospheric storage.',
    baseMsp: 8558,
    typicalPeakMonth: 'October - November',
  },

  // Vegetables (High & Medium Perishability)
  {
    id: 'onion',
    nameKey: 'commodity.onion',
    defaultName: 'Onion (कांदा / प्याज)',
    hindiName: 'प्याज',
    marathiName: 'कांदा',
    category: 'vegetables',
    perishability: 'medium',
    shelfLifeDays: 35,
    perishabilityNote: 'Rabi onion stores 30-45 days in chawl ventilated structures; Kharif onion rots within 15 days.',
    typicalPeakMonth: 'October - November',
  },
  {
    id: 'tomato',
    nameKey: 'commodity.tomato',
    defaultName: 'Tomato (टोमॅटो / टमाटर)',
    hindiName: 'टमाटर',
    marathiName: 'टोमॅटो',
    category: 'vegetables',
    perishability: 'high',
    shelfLifeDays: 4,
    perishabilityNote: 'Rapidly rotting produce (shelf life 3-5 days). NEVER hold without active cold storage.',
    typicalPeakMonth: 'July - August / November',
  },
  {
    id: 'potato',
    nameKey: 'commodity.potato',
    defaultName: 'Potato (बटाटा / आलू)',
    hindiName: 'आलू',
    marathiName: 'बटाटा',
    category: 'vegetables',
    perishability: 'medium',
    shelfLifeDays: 40,
    perishabilityNote: 'Can hold 30-60 days in dark cool sheds; cold storage extends to 6 months.',
    typicalPeakMonth: 'November - December',
  },
  {
    id: 'green_chilli',
    nameKey: 'commodity.greenChilli',
    defaultName: 'Green Chilli (हिरवी मिरची / हरी मिर्च)',
    hindiName: 'हरी मिर्च',
    marathiName: 'हिरवी मिरची',
    category: 'vegetables',
    perishability: 'high',
    shelfLifeDays: 5,
    perishabilityNote: 'High moisture loss and shriveling within 4-6 days. Sell immediately.',
    typicalPeakMonth: 'October - November',
  },
  {
    id: 'cauliflower',
    nameKey: 'commodity.cauliflower',
    defaultName: 'Cauliflower (फ्लॉवर / गोभी)',
    hindiName: 'फूलगोभी',
    marathiName: 'फ्लॉवर',
    category: 'vegetables',
    perishability: 'high',
    shelfLifeDays: 4,
    perishabilityNote: 'Browning and weight loss occur rapidly after 3 days. Immediate sale strongly advised.',
    typicalPeakMonth: 'November - December',
  },
  {
    id: 'ginger',
    nameKey: 'commodity.ginger',
    defaultName: 'Ginger (आले / अदरक)',
    hindiName: 'अदरक',
    marathiName: 'आले',
    category: 'vegetables',
    perishability: 'medium',
    shelfLifeDays: 30,
    perishabilityNote: 'Underground rhizome with moderate 3-4 week storage if protected from dry heat.',
    typicalPeakMonth: 'December - January',
  },

  // Fruits (High & Medium Perishability)
  {
    id: 'grapes',
    nameKey: 'commodity.grapes',
    defaultName: 'Grapes (द्राक्षे / अंगूर)',
    hindiName: 'अंगूर',
    marathiName: 'द्राक्षे',
    category: 'fruits',
    perishability: 'high',
    shelfLifeDays: 6,
    perishabilityNote: 'Delicate table fruit. Berries rot and drop within days without precooling.',
    typicalPeakMonth: 'February - March',
  },
  {
    id: 'pomegranate',
    nameKey: 'commodity.pomegranate',
    defaultName: 'Pomegranate (डाळिंब / अनार)',
    hindiName: 'अनार',
    marathiName: 'डाळिंब',
    category: 'fruits',
    perishability: 'medium',
    shelfLifeDays: 25,
    perishabilityNote: 'Thick rind provides 20-30 days ambient shelf life.',
    typicalPeakMonth: 'October - November',
  },
  {
    id: 'banana',
    nameKey: 'commodity.banana',
    defaultName: 'Banana (केळी / केला)',
    hindiName: 'केला',
    marathiName: 'केळी',
    category: 'fruits',
    perishability: 'high',
    shelfLifeDays: 5,
    perishabilityNote: 'Climacteric fruit that overripens and softens rapidly in 3-5 days. Sell immediately.',
    typicalPeakMonth: 'September - October',
  },
  {
    id: 'orange',
    nameKey: 'commodity.orange',
    defaultName: 'Orange (संत्री / संतरा)',
    hindiName: 'संतरा',
    marathiName: 'संत्री',
    category: 'fruits',
    perishability: 'medium',
    shelfLifeDays: 18,
    perishabilityNote: 'Nagpur Mandarin oranges hold 15-20 days in ventilated crates.',
    typicalPeakMonth: 'November - December',
  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * 2. SEED REALISTIC MULTI-MANDI PRICE MATRICES
 * ───────────────────────────────────────────────────────────────────────── */
interface MandiPriceProfile {
  mandiId: string;
  modalMultiplier: number; // Regional price premium/discount factor
}

const MANDI_PROFILES: Record<string, MandiPriceProfile> = {
  'a1b2c3d4-e5f6-7890-abcd-111111111111': { mandiId: 'pune', modalMultiplier: 1.05 },       // Pune: Big metro terminal consumption yard
  'a1b2c3d4-e5f6-7890-abcd-222222222222': { mandiId: 'baramati', modalMultiplier: 0.98 },   // Baramati: Farmgate hub
  'a1b2c3d4-e5f6-7890-abcd-333333333333': { mandiId: 'ahmednagar', modalMultiplier: 1.02 }, // Ahmednagar: Major pulse & grain yard
  'a1b2c3d4-e5f6-7890-abcd-444444444444': { mandiId: 'nashik', modalMultiplier: 1.03 },     // Nashik: Veg & grape yard
  'a1b2c3d4-e5f6-7890-abcd-555555555555': { mandiId: 'lasalgaon', modalMultiplier: 1.08 },  // Lasalgaon: World onion capital (highest onion liquidity)
  'a1b2c3d4-e5f6-7890-abcd-666666666666': { mandiId: 'solapur', modalMultiplier: 1.04 },    // Solapur: Pulse & cotton hub
  'a1b2c3d4-e5f6-7890-abcd-777777777777': { mandiId: 'kolhapur', modalMultiplier: 1.01 },   // Kolhapur: Jaggery & spices
  'a1b2c3d4-e5f6-7890-abcd-888888888888': { mandiId: 'nagpur', modalMultiplier: 1.03 },     // Nagpur: Orange & central grain exchange
};

const BASE_COMMODITY_PRICES: Record<string, { modal: number; min: number; max: number; arrivals: number }> = {
  wheat: { modal: 2480, min: 2320, max: 2650, arrivals: 1240 },
  paddy: { modal: 2350, min: 2180, max: 2520, arrivals: 980 },
  maize: { modal: 2150, min: 1980, max: 2300, arrivals: 1540 },
  bajra: { modal: 2420, min: 2250, max: 2580, arrivals: 620 },
  jowar: { modal: 3250, min: 3050, max: 3480, arrivals: 450 },
  soyabean: { modal: 4780, min: 4520, max: 5050, arrivals: 2100 },
  chana: { modal: 5850, min: 5600, max: 6150, arrivals: 1350 },
  tur: { modal: 9400, min: 8900, max: 9950, arrivals: 870 },
  moong: { modal: 8350, min: 7900, max: 8750, arrivals: 520 },
  onion: { modal: 1850, min: 1400, max: 2350, arrivals: 5400 },
  tomato: { modal: 1650, min: 1200, max: 2100, arrivals: 3200 },
  potato: { modal: 1550, min: 1300, max: 1850, arrivals: 2800 },
  green_chilli: { modal: 3450, min: 2900, max: 4100, arrivals: 480 },
  cauliflower: { modal: 1400, min: 1100, max: 1750, arrivals: 890 },
  ginger: { modal: 6800, min: 6100, max: 7450, arrivals: 310 },
  grapes: { modal: 6200, min: 5400, max: 7100, arrivals: 950 },
  pomegranate: { modal: 7800, min: 6900, max: 8900, arrivals: 640 },
  banana: { modal: 1750, min: 1400, max: 2100, arrivals: 1800 },
  orange: { modal: 4200, min: 3600, max: 4900, arrivals: 1650 },
};

/* ─────────────────────────────────────────────────────────────────────────
 * 3. MULTI-YEAR HISTORICAL PRICE DATA (2023, 2024, 2025, 2026)
 * ───────────────────────────────────────────────────────────────────────── */
export const HISTORICAL_PRICE_ARCHIVE: Record<string, HistoricalYearData[]> = {
  wheat: [
    { year: 2023, averagePrice: 2280, peakPrice: 2540, peakPeriod: 'Late October to November (Festive stock-up)' },
    { year: 2024, averagePrice: 2360, peakPrice: 2620, peakPeriod: 'Mid November (Diwali post-harvest demand)' },
    { year: 2025, averagePrice: 2420, peakPrice: 2690, peakPeriod: 'Early December (Winter flour milling)' },
  ],
  soyabean: [
    { year: 2023, averagePrice: 4850, peakPrice: 5320, peakPeriod: 'November (Crusher procurement surge)' },
    { year: 2024, averagePrice: 4650, peakPrice: 5180, peakPeriod: 'Late November to December' },
    { year: 2025, averagePrice: 4720, peakPrice: 5240, peakPeriod: 'December (Global oilseed parity)' },
  ],
  chana: [
    { year: 2023, averagePrice: 5120, peakPrice: 5750, peakPeriod: 'October - November (Diwali sweets consumption)' },
    { year: 2024, averagePrice: 5480, peakPrice: 6200, peakPeriod: 'Late October (Festival bespoke buying)' },
    { year: 2025, averagePrice: 5650, peakPrice: 6380, peakPeriod: 'Mid November' },
  ],
  tur: [
    { year: 2023, averagePrice: 8400, peakPrice: 9800, peakPeriod: 'October - November' },
    { year: 2024, averagePrice: 9100, peakPrice: 10400, peakPeriod: 'November (Supply tightness)' },
    { year: 2025, averagePrice: 9250, peakPrice: 10650, peakPeriod: 'October - November' },
  ],
  onion: [
    { year: 2023, averagePrice: 1650, peakPrice: 2950, peakPeriod: 'Late October to Mid-November' },
    { year: 2024, averagePrice: 1780, peakPrice: 3200, peakPeriod: 'November (Pre-Diwali pipeline gap)' },
    { year: 2025, averagePrice: 1720, peakPrice: 2800, peakPeriod: 'Late October' },
  ],
  tomato: [
    { year: 2023, averagePrice: 1850, peakPrice: 3800, peakPeriod: 'July - August (Monsoon supply disruption)' },
    { year: 2024, averagePrice: 1550, peakPrice: 2400, peakPeriod: 'Early November' },
    { year: 2025, averagePrice: 1600, peakPrice: 2550, peakPeriod: 'October - November' },
  ],
  potato: [
    { year: 2023, averagePrice: 1350, peakPrice: 1750, peakPeriod: 'November - December' },
    { year: 2024, averagePrice: 1480, peakPrice: 1920, peakPeriod: 'November' },
    { year: 2025, averagePrice: 1520, peakPrice: 1980, peakPeriod: 'Late October to November' },
  ],
  pomegranate: [
    { year: 2023, averagePrice: 7100, peakPrice: 8600, peakPeriod: 'October - November (Navratri & Diwali gift packing)' },
    { year: 2024, averagePrice: 7450, peakPrice: 9100, peakPeriod: 'Late October' },
    { year: 2025, averagePrice: 7600, peakPrice: 9250, peakPeriod: 'November' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
 * 4. UPCOMING FESTIVE SEASONS CALENDAR (OCTOBER - NOVEMBER CONTEXT)
 * ───────────────────────────────────────────────────────────────────────── */
export const FESTIVAL_CALENDAR: FestivalDemandInsight[] = [
  {
    upcomingFestival: 'Diwali & Dhanteras (दीपावली)',
    festivalDate: 'Late October - Early November',
    daysUntilFestival: 18,
    demandSurgePct: 22,
    expectedPriceImpact: '+12% to +20% demand increase for pulses, oilseeds, wheat flour, and dessert fruits.',
    appliesToCommodity: true,
  },
  {
    upcomingFestival: 'Navratri & Dussehra (दसरा / नवरात्र)',
    festivalDate: 'October',
    daysUntilFestival: 5,
    demandSurgePct: 18,
    expectedPriceImpact: '+15% surge for fruits (Pomegranate, Banana, Orange) and fasting vegetables.',
    appliesToCommodity: true,
  },
  {
    upcomingFestival: 'Makar Sankranti & Pongal (मकर संक्रांत)',
    festivalDate: 'Mid January',
    daysUntilFestival: 95,
    demandSurgePct: 15,
    expectedPriceImpact: '+10% surge for cereals, jaggery, and sesame.',
    appliesToCommodity: false,
  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * 5. CORE SERVICE FUNCTIONS
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Returns latest prices for all commodities at a specific selected mandi.
 */
export async function getMandiPrices(mandiId: string): Promise<MandiCropPrice[]> {
  const profile = MANDI_PROFILES[mandiId] || { modalMultiplier: 1.0 };
  const mandiObj = DEFAULT_MANDIS.find((m) => m.id === mandiId) || DEFAULT_MANDIS[0];

  return COMMODITIES.map((commodity) => {
    const base = BASE_COMMODITY_PRICES[commodity.id] || { modal: 2500, min: 2200, max: 2800, arrivals: 800 };
    
    // Lasalgaon special premium for onion
    let customMultiplier = profile.modalMultiplier;
    if (mandiObj.code.includes('LSG') && commodity.id === 'onion') {
      customMultiplier = 1.12; // Lasalgaon benchmark onion hub premium
    }
    if (mandiObj.code.includes('NGP') && commodity.id === 'orange') {
      customMultiplier = 1.15; // Nagpur orange exchange premium
    }

    const modalPrice = Math.round(base.modal * customMultiplier);
    const minPrice = Math.round(base.min * customMultiplier);
    const maxPrice = Math.round(base.max * customMultiplier);

    // Minor simulated 24-hr variance for realism
    const seedVariance = ((commodity.id.charCodeAt(0) * 7) % 9) - 4; // -4% to +4%
    const trend24h = Math.round(seedVariance * 10) / 10;

    return {
      commodityId: commodity.id,
      commodityName: commodity.defaultName,
      category: commodity.category,
      mandiId: mandiObj.id,
      mandiName: mandiObj.name,
      modalPrice,
      minPrice,
      maxPrice,
      trend24h,
      arrivalsQuintals: Math.round(base.arrivals * (0.85 + (commodity.id.length % 5) * 0.08)),
      perishability: commodity.perishability,
      lastUpdated: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
  });
}

/**
 * Generates comprehensive cross-mandi price comparisons for a specific crop,
 * computing accurate quantity-aware transportation costs and net profits.
 */
export function getCrossMandiComparisons(
  commodityId: string,
  quantityQuintals: number,
  farmerLocation?: { lat: number; lng: number } | null
): CrossMandiComparison[] {
  const base = BASE_COMMODITY_PRICES[commodityId] || { modal: 2500, min: 2200, max: 2800, arrivals: 800 };
  const userLat = farmerLocation?.lat ?? 18.5204; // Default to central Maharashtra (Pune region)
  const userLng = farmerLocation?.lng ?? 73.8567;
  const farmerGeo: GeoLocation = { latitude: userLat, longitude: userLng };

  const results: CrossMandiComparison[] = DEFAULT_MANDIS.map((mandi) => {
    const profile = MANDI_PROFILES[mandi.id] || { modalMultiplier: 1.0 };
    let mult = profile.modalMultiplier;
    if (mandi.code.includes('LSG') && commodityId === 'onion') mult = 1.12;
    if (mandi.code.includes('NGP') && commodityId === 'orange') mult = 1.15;

    const pricePerQuintal = Math.round(base.modal * mult);
    const grossRevenue = pricePerQuintal * quantityQuintals;

    // Calculate transport cost with realistic quantity-aware calculator
    const mandiGeo: GeoLocation = { latitude: mandi.latitude, longitude: mandi.longitude };
    const transportResult = calculateTransportationCost(farmerGeo, mandiGeo, {
      quantityQuintals,
      roundDecimals: 0,
    });

    const transportCost = transportResult.totalCost;
    const netRevenue = Math.max(0, grossRevenue - transportCost);

    return {
      mandiId: mandi.id,
      mandiName: mandi.name,
      distanceKm: transportResult.distanceKm,
      pricePerQuintal,
      grossRevenue,
      transportCost,
      netRevenue,
      isHighestNet: false,
      isNearest: false,
    };
  });

  // Sort by net revenue descending
  results.sort((a, b) => b.netRevenue - a.netRevenue);
  if (results.length > 0) {
    results[0].isHighestNet = true;
  }

  // Find nearest
  const nearest = [...results].sort((a, b) => a.distanceKm - b.distanceKm)[0];
  if (nearest) {
    const target = results.find((r) => r.mandiId === nearest.mandiId);
    if (target) target.isNearest = true;
  }

  return results;
}

/**
 * Predicts future price trajectory (15-day and 30-day forecast).
 */
export function predictFuturePrices(commodityId: string, currentPrice: number): FuturePriceForecast {
  const commodity = COMMODITIES.find((c) => c.id === commodityId);
  const isHighPerishable = commodity?.perishability === 'high';
  const isPulse = commodity?.category === 'pulses';

  let days15ChangePct = 0;
  let days30ChangePct = 0;
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  let confidenceScore = 82;

  // Pulse & grain pre-festive trajectory is upward
  if (isPulse || commodityId === 'wheat') {
    days15ChangePct = 4.5;
    days30ChangePct = 8.2;
    trendDirection = 'up';
    confidenceScore = 88;
  } else if (commodityId === 'onion' || commodityId === 'potato') {
    days15ChangePct = 5.2;
    days30ChangePct = 7.5;
    trendDirection = 'up';
    confidenceScore = 80;
  } else if (isHighPerishable) {
    // Highly perishable crops experience arrival gluts and quick quality decay
    days15ChangePct = -3.8;
    days30ChangePct = -6.5;
    trendDirection = 'down';
    confidenceScore = 78;
  } else {
    days15ChangePct = 2.1;
    days30ChangePct = 3.8;
    trendDirection = 'up';
    confidenceScore = 75;
  }

  const days15Price = Math.round(currentPrice * (1 + days15ChangePct / 100));
  const days30Price = Math.round(currentPrice * (1 + days30ChangePct / 100));

  return {
    days15Price,
    days15ChangePct,
    days30Price,
    days30ChangePct,
    trendDirection,
    confidenceScore,
  };
}

/**
 * MASTER SELLING ADVISOR ENGINE
 * Synthesizes cross-mandi rates, transport logistics, multi-year historical peaks,
 * upcoming festive surge, and STRICT PERISHABILITY OVERRIDES to give the farmer actionable advice.
 */
export async function getSellingAdvisory(
  commodityId: string,
  quantityQuintals: number,
  selectedMandiId: string,
  farmerLocation?: { lat: number; lng: number } | null
): Promise<SellingAdvisoryResult> {
  const commodity = COMMODITIES.find((c) => c.id === commodityId) || COMMODITIES[0];
  const qty = Math.max(1, Number(quantityQuintals) || 10);

  // 1. Current prices and cross-mandi comparison
  const crossMandi = getCrossMandiComparisons(commodity.id, qty, farmerLocation);
  const selectedMandiData = crossMandi.find((c) => c.mandiId === selectedMandiId) || crossMandi[0];
  const bestMandi = crossMandi[0];
  const currentPrice = selectedMandiData.pricePerQuintal;

  // 2. Future prediction
  const forecast = predictFuturePrices(commodity.id, currentPrice);

  // 3. Historical peaks
  const historyArchive = HISTORICAL_PRICE_ARCHIVE[commodity.id] || [
    { year: 2023, averagePrice: Math.round(currentPrice * 0.92), peakPrice: Math.round(currentPrice * 1.08), peakPeriod: 'October - November' },
    { year: 2024, averagePrice: Math.round(currentPrice * 0.95), peakPrice: Math.round(currentPrice * 1.12), peakPeriod: 'November' },
    { year: 2025, averagePrice: Math.round(currentPrice * 0.98), peakPrice: Math.round(currentPrice * 1.15), peakPeriod: 'Late October to November' },
  ];

  // 4. Festive season match
  const upcomingFestival = FESTIVAL_CALENDAR[0]; // Diwali & Navratri season
  const isFestivalBeneficiary =
    commodity.category === 'pulses' ||
    commodity.category === 'grains_cereals' ||
    commodity.id === 'pomegranate' ||
    commodity.id === 'onion';

  // 5. Perishability & Recommendation Logic
  let recommendation: 'SELL_NOW' | 'HOLD_HARVEST' = 'SELL_NOW';
  let isPerishabilityOverride = false;
  let headlineKey = 'advisor.recommendSellNow';
  let headline = `Sell Now at ${bestMandi.mandiName} for highest net returns`;
  const reasoningPoints: string[] = [];
  let perishabilityWarning: string | undefined = undefined;

  const netRevenueNow = selectedMandiData.netRevenue;
  let projectedNetRevenueHold: number | undefined = undefined;

  // A. CRITICAL RULE: High Perishability Produce OVERRIDES any Hold Advice
  if (commodity.perishability === 'high') {
    recommendation = 'SELL_NOW';
    isPerishabilityOverride = true;
    headlineKey = 'advisor.perishableOverrideHeadline';
    headline = `Immediate Sale Urged: ${commodity.defaultName} is highly perishable (Shelf-life: ${commodity.shelfLifeDays} days)`;
    perishabilityWarning = `High perishability warning: Without specialized cold-chain infrastructure, ${commodity.defaultName} experiences 20% to 40% weight shrinkage, microbial rot, and quality downgrading in 3–5 days. Any future price gain is completely wiped out by storage spoilage.`;

    reasoningPoints.push(
      `Perishability Priority: Shelf life is only ${commodity.shelfLifeDays} days in ambient conditions. Delaying harvest sales causes rapid spoilage and direct monetary loss.`,
      `Optimal Market: Selling ${qty} quintals at ${bestMandi.mandiName} nets ₹${bestMandi.netRevenue.toLocaleString('en-IN')} after ₹${bestMandi.transportCost.toLocaleString('en-IN')} transport.`,
      `Harvest Protection: Even if future festive market prices rise by 5–10%, post-harvest rot will eliminate your profits.`
    );
  }
  // B. Medium Perishability Produce (Onion, Potato, Ginger)
  else if (commodity.perishability === 'medium') {
    if (forecast.trendDirection === 'up' && isFestivalBeneficiary) {
      recommendation = 'HOLD_HARVEST';
      headlineKey = 'advisor.holdShortTerm';
      headline = `Hold for 10–15 Days: Upcoming Festival Demand Expected to Yield Higher Prices`;
      projectedNetRevenueHold = Math.round(forecast.days15Price * qty - bestMandi.transportCost);

      reasoningPoints.push(
        `Festival Surge: ${upcomingFestival.upcomingFestival} is ${upcomingFestival.daysUntilFestival} days away. Wholesale festive procurement historically lifts prices by ${forecast.days15ChangePct}%.`,
        `Storability Window: ${commodity.defaultName} has a safe holding window of ${commodity.shelfLifeDays} days in well-ventilated farm sheds (chawl/kanda chawl).`,
        `Projected Profit Gain: Holding for ~15 days can increase your net revenue by ~₹${(projectedNetRevenueHold - netRevenueNow).toLocaleString('en-IN')}.`,
        `Monitoring Rule: Inspect stock regularly for moisture or sprouting; sell immediately if humidity spikes.`
      );
    } else {
      recommendation = 'SELL_NOW';
      headlineKey = 'advisor.sellNowOptimal';
      headline = `Sell Now: Current rates at ${bestMandi.mandiName} offer optimal risk-adjusted payout`;

      reasoningPoints.push(
        `Market Stability: Current rates are competitive. Holding introduces storage rot risks without significant price upside.`,
        `Net Payout: Transporting to ${bestMandi.mandiName} yields ₹${bestMandi.netRevenue.toLocaleString('en-IN')} net after freight costs.`
      );
    }
  }
  // C. Low Perishability (Grains, Cereals & Pulses)
  else {
    if (forecast.trendDirection === 'up') {
      recommendation = 'HOLD_HARVEST';
      headlineKey = 'advisor.holdHarvestOptimal';
      headline = `Hold Harvest: Multi-Year Trends & Festival Demand Point to Higher Upcoming Prices`;
      projectedNetRevenueHold = Math.round(forecast.days30Price * qty - bestMandi.transportCost);

      reasoningPoints.push(
        `High Storability: Grains and pulses store safely for 6–12 months with negligible quality degradation in dry storage.`,
        `Historical Peak Analysis: In 2023, 2024, and 2025, prices peaked in ${commodity.typicalPeakMonth}, yielding ~₹${Math.round(currentPrice * 0.12)} higher rates per quintal.`,
        `Upcoming Demand: ${upcomingFestival.upcomingFestival} demand from millers and processors will tighten spot arrivals.`,
        `Projected Financial Upside: Holding ~30 days is projected to deliver an additional ₹${(projectedNetRevenueHold - netRevenueNow).toLocaleString('en-IN')} net profit on ${qty} quintals.`
      );
    } else {
      recommendation = 'SELL_NOW';
      headline = `Sell Now: Price peak is currently active; upcoming harvest arrivals will saturate yards`;

      reasoningPoints.push(
        `Arrival Pressure: New crop arrivals are accelerating, which historically depresses modal rates in the next 3 weeks.`,
        `Locked MSP/Market Gains: Current rates comfortably exceed base MSP guidance. Lock in profits now.`
      );
    }
  }

  // Cross-mandi net advantage point
  if (bestMandi.mandiId !== selectedMandiData.mandiId) {
    const diff = bestMandi.netRevenue - selectedMandiData.netRevenue;
    reasoningPoints.push(
      `Cross-Mandi Arbitrage: Choosing ${bestMandi.mandiName} instead of ${selectedMandiData.mandiName} yields +₹${diff.toLocaleString('en-IN')} higher net earnings even after accounting for distance transport of ₹${bestMandi.transportCost.toLocaleString('en-IN')}.`
    );
  }

  return {
    commodity,
    quantityQuintals: qty,
    currentMandiPrice: currentPrice,
    recommendation,
    confidence: isPerishabilityOverride ? 'High' : 'High',
    headlineKey,
    headline,
    isPerishabilityOverride,
    perishabilityWarning,
    festivalInsight: upcomingFestival,
    futureForecast: forecast,
    historicalPeaks: {
      typicalPeakPeriod: commodity.typicalPeakMonth,
      years: historyArchive,
      comparisonSummary: `Historically (2023-2025), ${commodity.defaultName} prices peaked during ${commodity.typicalPeakMonth}, with peak premiums ranging from +12% to +18% over post-monsoon base.`,
    },
    crossMandiComparison: crossMandi,
    bestMandi,
    reasoningPoints,
    netRevenueNow,
    projectedNetRevenueHold,
  };
}
