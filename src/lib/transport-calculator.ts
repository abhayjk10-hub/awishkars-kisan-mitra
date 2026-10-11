import { Language, t } from './translations/index';

/**
 * Geographic coordinates (latitude and longitude).
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * Geographic coordinates (latitude and longitude).
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * Quantity-Aware Agricultural Transport Economics Configuration
 * In Indian rural logistics, flat per-km rates fail because moving 10 tonnes of grain
 * requires distinct commercial vehicle classes, fuel burn, driver wages, and loading labor.
 */
export interface AgriTransportConfig {
  /** Base mobilization & positioning fee in ₹ (minimum trip charge) */
  baseMobilizationFee: number;
  /** Distance base rate in ₹/km for vehicle operation */
  baseRatePerKm: number;
  /** Freight load factor in ₹/quintal/km (standard ~₹8/tonne-km) */
  ratePerQuintalKm: number;
  /** Mandi yard loading & unloading handling fee in ₹/quintal */
  handlingPerQuintal: number;
}

export const DEFAULT_TRANSPORT_CONFIG: AgriTransportConfig = {
  baseMobilizationFee: 350, // Minimum vehicle engagement & dock placement fee
  baseRatePerKm: 24,        // Base vehicle running rate per km (diesel + driver)
  ratePerQuintalKm: 0.85,   // Freight tariff per quintal per km (~₹8.50 per ton-km)
  handlingPerQuintal: 12,   // Hamali / mandi yard loading & unloading labor per quintal
};

/** Vehicle classification tiers according to crop load in quintals */
export interface VehicleTier {
  id: string;
  name: string;
  hindiName: string;
  maxQuintals: number;
  baseRatePerKm: number;
  baseMobilization: number;
}

export const VEHICLE_TIERS: VehicleTier[] = [
  { id: 'mini_tempo', name: 'Mini Tempo (Tata Ace)', hindiName: 'छोटा हाथी / टेम्पो', maxQuintals: 15, baseRatePerKm: 22, baseMobilization: 350 },
  { id: 'pickup', name: 'Pickup Truck (Bolero Maxi)', hindiName: 'पिकअप ट्रक', maxQuintals: 35, baseRatePerKm: 26, baseMobilization: 450 },
  { id: 'tractor', name: 'Tractor Trolley', hindiName: 'ट्रैक्टर ट्रॉली', maxQuintals: 75, baseRatePerKm: 32, baseMobilization: 600 },
  { id: 'heavy_truck', name: 'Commercial Truck (6-Wheeler)', hindiName: 'कमर्शियल ट्रक', maxQuintals: 250, baseRatePerKm: 42, baseMobilization: 950 },
];

/**
 * Backward-compatible rate bounds for legacy ratePerKm slider
 */
export const MIN_TRANSPORT_RATE = 50;
export const MAX_TRANSPORT_RATE = 120;
export const DEFAULT_TRANSPORT_RATE = 65;

export interface TransportCostOptions {
  /** Quantity of crop in quintals (1 quintal = 100 kg). Defaults to 15 Qtl. */
  quantityQuintals?: number;

  /**
   * Optional manual override rate per km.
   * If provided, overrides dynamic vehicle rate.
   */
  ratePerKm?: number;

  /**
   * Target UI display language.
   * Supports 'en' | 'hi' | 'mr' | 'gu' | 'pa'.
   * Defaults to 'en'.
   */
  language?: Language;

  /**
   * Number of decimal places to round the final rupee cost.
   * Defaults to 0.
   */
  roundDecimals?: number;
}

export interface TransportCostResult {
  /** Distance in kilometers (accurate Haversine calculation) */
  distanceKm: number;
  /** Quantity of produce in quintals */
  quantityQuintals: number;
  /** Recommended vehicle tier */
  vehicle: VehicleTier;
  /** Effective rate applied in ₹/km */
  ratePerKm: number;
  /** Total calculated cost in Indian Rupees */
  totalCost: number;
  /** Cost per quintal in Indian Rupees */
  costPerQuintal: number;
  /** Detailed cost components breakdown */
  breakdown: {
    baseMobilization: number;
    distanceCost: number;
    weightFreightCost: number;
    handlingCost: number;
  };
  /** Formatted cost string with ₹ symbol (e.g., "₹1,250") */
  formattedCost: string;
  /** Formatted cost per quintal string (e.g., "₹83/Qtl") */
  formattedCostPerQuintal: string;
  /** Formatted distance string (e.g., "25.0 km") */
  formattedDistance: string;
  /** Formatted rate string (e.g., "₹52/km") */
  formattedRate: string;
  /** Estimated transit duration in minutes */
  estimatedTransitMinutes: number;
  /** Localized human-readable duration */
  formattedTransitTime: string;
  /** Localized full summary message */
  summary: string;
  /** Multilingual UI labels localized in the requested language */
  labels: {
    title: string;
    distance: string;
    rate: string;
    totalCost: string;
    perKm: string;
    transitTime: string;
    transitNote: string;
  };
  farmerLocation: GeoLocation;
  mandiLocation: GeoLocation;
}

/**
 * Calculates the great-circle distance between two GPS coordinates using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers rounded to two decimal places.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Retrieves the farmer's current GPS location from the device browser using navigator.geolocation.
 *
 * @param options GeolocationPositionOptions (high accuracy, timeout, etc.)
 * @returns Promise resolving to { latitude, longitude }
 */
export function getFarmerCurrentLocation(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser or environment.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission was denied by the user.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is currently unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Request to get user location timed out.';
            break;
        }
        reject(new Error(message));
      },
      options
    );
  });
}

/**
 * Calculates the transportation cost from the farmer's location to a mandi location.
 *
 * Distance is computed using the Haversine formula and multiplied by a realistic,
 * quantity-aware agricultural freight model accounting for vehicle class, fuel running,
 * weight load factor per quintal-km, and loading/unloading handling charges.
 *
 * @param farmerLocation Farmer's GPS coordinate
 * @param mandiLocation Mandi's GPS coordinate
 * @param options Configuration options (quantityQuintals, ratePerKm, language, roundDecimals)
 * @returns Comprehensive, multilingual, quantity-aware TransportCostResult
 */
export function calculateTransportationCost(
  farmerLocation: GeoLocation,
  mandiLocation: GeoLocation,
  options: TransportCostOptions = {}
): TransportCostResult {
  const {
    quantityQuintals = 15,
    ratePerKm,
    language = 'en',
    roundDecimals = 0,
  } = options;

  // Sanitized quantity
  const qty = Math.max(1, Number(quantityQuintals) || 15);

  // Compute distance via Haversine
  const distanceKm = calculateHaversineDistanceKm(
    farmerLocation.latitude,
    farmerLocation.longitude,
    mandiLocation.latitude,
    mandiLocation.longitude
  );

  // Select appropriate vehicle tier based on quantity load
  const vehicle =
    VEHICLE_TIERS.find((v) => qty <= v.maxQuintals) ||
    VEHICLE_TIERS[VEHICLE_TIERS.length - 1];

  // If manual rate override is passed, use it for base distance running
  const effectiveBaseKmRate =
    ratePerKm !== undefined
      ? Math.min(Math.max(ratePerKm, MIN_TRANSPORT_RATE), MAX_TRANSPORT_RATE)
      : vehicle.baseRatePerKm;

  // Cost components
  const baseMobilization = vehicle.baseMobilization;
  const distanceCost = distanceKm * effectiveBaseKmRate;
  const weightFreightCost = qty * distanceKm * DEFAULT_TRANSPORT_CONFIG.ratePerQuintalKm;
  const handlingCost = qty * DEFAULT_TRANSPORT_CONFIG.handlingPerQuintal;

  const rawTotal = baseMobilization + distanceCost + weightFreightCost + handlingCost;
  const factor = Math.pow(10, roundDecimals);
  const totalCost = Math.round(rawTotal * factor) / factor;

  const effectiveRatePerKm = distanceKm > 0 ? Math.round((totalCost / distanceKm) * 10) / 10 : effectiveBaseKmRate;
  const costPerQuintal = Math.round((totalCost / qty) * 10) / 10;

  // Transit time estimation (~30 km/h average speed for rural agri-cargo / tractor)
  const estimatedTransitMinutes = Math.max(10, Math.round((distanceKm / 30) * 60));
  const hours = Math.floor(estimatedTransitMinutes / 60);
  const mins = estimatedTransitMinutes % 60;

  const formattedTransitTime =
    hours > 0
      ? t('transport.hoursMin', language, { hours, mins })
      : t('transport.minsOnly', language, { mins });

  const formattedCost = `₹${totalCost.toLocaleString('en-IN', {
    minimumFractionDigits: roundDecimals,
    maximumFractionDigits: roundDecimals,
  })}`;

  const formattedCostPerQuintal = `₹${costPerQuintal.toLocaleString('en-IN', {
    maximumFractionDigits: 1,
  })}/Qtl`;

  const formattedDistance = `${distanceKm.toFixed(1)} km`;
  const formattedRate = `₹${effectiveRatePerKm}${t('transport.perKm', language)}`;

  const summary = t('transport.summary', language, {
    cost: totalCost.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    distance: distanceKm.toFixed(1),
    rate: Math.round(effectiveRatePerKm),
  });

  return {
    distanceKm,
    quantityQuintals: qty,
    vehicle,
    ratePerKm: effectiveRatePerKm,
    totalCost,
    costPerQuintal,
    breakdown: {
      baseMobilization,
      distanceCost: Math.round(distanceCost),
      weightFreightCost: Math.round(weightFreightCost),
      handlingCost: Math.round(handlingCost),
    },
    formattedCost,
    formattedCostPerQuintal,
    formattedDistance,
    formattedRate,
    estimatedTransitMinutes,
    formattedTransitTime,
    summary,
    labels: {
      title: t('transport.title', language),
      distance: t('transport.distance', language),
      rate: t('transport.ratePerKm', language),
      totalCost: t('transport.totalCost', language),
      perKm: t('transport.perKm', language),
      transitTime: t('transport.estTransitTime', language),
      transitNote: t('transport.transitNote', language),
    },
    farmerLocation,
    mandiLocation,
  };
}

/**
 * End-to-end convenience function:
 * Automatically retrieves the user's current GPS location from their device,
 * then computes the transportation cost to the target mandi.
 *
 * @param mandiLocation Target mandi coordinates
 * @param options Calculation options
 * @returns Promise resolving to TransportCostResult
 */
export async function calculateTransportCostFromDevice(
  mandiLocation: GeoLocation,
  options?: TransportCostOptions
): Promise<TransportCostResult> {
  const farmerLocation = await getFarmerCurrentLocation();
  return calculateTransportationCost(farmerLocation, mandiLocation, options);
}
