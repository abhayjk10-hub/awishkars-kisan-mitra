'use client';

import React from 'react';
import {
  Compass,
  MapPin,
  RefreshCw,
  Check,
  LocateFixed,
  Truck,
  Building2,
} from 'lucide-react';
import { Mandi } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { calculateTransportationCost, GeoLocation } from '@/lib/transport-calculator';

interface MandiSelectorProps {
  mandis: Mandi[];
  selectedMandiId: string;
  onSelectMandi: (mandiId: string) => void;
  userLocation: { lat: number; lng: number } | null;
  locationStatus: 'prompting' | 'granted' | 'denied' | 'error';
  locationError: string | null;
  onRequestLocation: () => void;
  loading?: boolean;
  quantityQuintals?: number;
  title?: string;
  subtitle?: string;
}

export default function MandiSelector({
  mandis,
  selectedMandiId,
  onSelectMandi,
  userLocation,
  locationStatus,
  locationError,
  onRequestLocation,
  loading = false,
  quantityQuintals = 15,
  title,
  subtitle,
}: MandiSelectorProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Geolocation Status Bar */}
      <div className="p-4 rounded-2xl bg-white/90 border border-primary-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center shrink-0">
            <Compass className={`w-5 h-5 ${locationStatus === 'prompting' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-primary-600">
              {locationStatus === 'granted'
                ? t('slot.geoActive', language)
                : locationStatus === 'prompting'
                ? t('slot.geoDetecting', language)
                : t('slot.geoAccess', language)}
            </p>
            <p className="text-sm font-semibold text-primary-950">
              {locationStatus === 'granted'
                ? t('slot.geoActiveDesc', language)
                : locationStatus === 'prompting'
                ? t('slot.geoDetectingDesc', language)
                : locationError || t('slot.geoDefaultDesc', language)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRequestLocation}
          className="self-start sm:self-center inline-flex items-center gap-2 text-xs font-bold text-primary-800 hover:text-primary-950 bg-primary-100 hover:bg-primary-200 px-3.5 py-2 rounded-xl transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('slot.refreshGps', language)}</span>
        </button>
      </div>

      {/* Mandi Cards List */}
      <section className="bg-white/95 border border-primary-200 rounded-[1.75rem] shadow-md p-5 sm:p-7">
        <div className="flex items-center justify-between border-b border-primary-100 pb-4 mb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-primary-600 font-bold">
              {title || t('slot.step1Title', language)}
            </span>
            <h2 className="text-xl font-bold text-primary-950 mt-0.5">
              {subtitle || t('slot.step1Heading', language)}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-primary-700">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
            <p>{t('slot.loadingMandis', language)}</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {mandis.map((mandi) => {
              const isSelected = selectedMandiId === mandi.id;

              // Calculate quantity-aware estimated transport cost
              let estCost: number | null = null;
              if (userLocation && mandi.latitude && mandi.longitude) {
                const farmerGeo: GeoLocation = { latitude: userLocation.lat, longitude: userLocation.lng };
                const mandiGeo: GeoLocation = { latitude: mandi.latitude, longitude: mandi.longitude };
                const costRes = calculateTransportationCost(farmerGeo, mandiGeo, {
                  quantityQuintals,
                  roundDecimals: 0,
                });
                estCost = costRes.totalCost;
              } else if (mandi.distance_km !== undefined) {
                estCost = Math.round(350 + mandi.distance_km * 24 + quantityQuintals * mandi.distance_km * 0.85);
              }

              return (
                <button
                  type="button"
                  key={mandi.id}
                  onClick={() => onSelectMandi(mandi.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-primary-700 bg-primary-50/90 shadow-md ring-2 ring-primary-500/20'
                      : 'border-primary-100 bg-white hover:border-primary-300 hover:bg-primary-50/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-base text-primary-950 font-bold">{mandi.name}</strong>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary-100 text-primary-800">
                        {mandi.code}
                      </span>
                      {mandi.distance_km !== undefined && (
                        <>
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <LocateFixed className="w-3 h-3 text-emerald-600" />
                            {t('slot.distanceKm', language, { dist: mandi.distance_km })}
                          </span>
                          {estCost !== null && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 flex items-center gap-1">
                              <Truck className="w-3 h-3 text-amber-700" />
                              ~₹{estCost.toLocaleString('en-IN')} ({quantityQuintals} Qtl)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-primary-700 line-clamp-1">{mandi.address}</p>
                    <div className="flex items-center gap-3 text-[11px] text-primary-600 flex-wrap">
                      <span>🕒 {t('slot.openHours', language, { hours: `${mandi.opening_time} – ${mandi.closing_time}` })}</span>
                      <span>•</span>
                      <span>{t('slot.vehiclesPerSlot', language, { cap: mandi.slot_capacity })}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-primary-700 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-primary-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
