'use client';

import React from 'react';
import { MandiCropPrice } from '@/lib/mandi-price-service';
import { TrendingUp, TrendingDown, Minus, Building2, Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

interface MandiPriceTickerProps {
  prices: MandiCropPrice[];
  mandiName: string;
}

export default function MandiPriceTicker({ prices, mandiName }: MandiPriceTickerProps) {
  const { language } = useLanguage();

  if (!prices || prices.length === 0) return null;

  // Duplicate items for continuous seamless loop
  const tickerItems = [...prices, ...prices];

  return (
    <div className="relative overflow-hidden bg-primary-950 text-white rounded-2xl border border-white/10 shadow-lg py-2.5 px-4 mb-6">
      <div className="flex items-center gap-3">
        {/* Mandi live label badge */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider z-10 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{mandiName}</span>
        </div>

        {/* Scrolling Track */}
        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-6 animate-marquee-ticker hover:[animation-play-state:paused] w-max">
            {tickerItems.map((item, index) => {
              const isPositive = item.trend24h > 0;
              const isNegative = item.trend24h < 0;

              return (
                <div
                  key={`${item.commodityId}-${index}`}
                  className="inline-flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1 rounded-xl text-xs"
                >
                  <span className="font-bold text-white">{item.commodityName}</span>
                  <span className="font-extrabold text-emerald-300">
                    ₹{item.modalPrice.toLocaleString('en-IN')}/Qtl
                  </span>

                  {isPositive && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center">
                      <TrendingUp className="w-3 h-3 inline mr-0.5" />+{item.trend24h}%
                    </span>
                  )}
                  {isNegative && (
                    <span className="text-[10px] font-bold text-red-400 flex items-center">
                      <TrendingDown className="w-3 h-3 inline mr-0.5" />{item.trend24h}%
                    </span>
                  )}
                  {!isPositive && !isNegative && (
                    <span className="text-[10px] font-bold text-primary-300 flex items-center">
                      <Minus className="w-3 h-3 inline mr-0.5" />0.0%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
