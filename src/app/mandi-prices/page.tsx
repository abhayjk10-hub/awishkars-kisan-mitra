'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Truck,
  Building2,
  DollarSign,
  ChevronRight,
  BarChart3,
  Flame,
  Info,
  Scale,
  Wheat,
  Apple,
  Carrot,
  Leaf,
  Layers,
  HelpCircle,
} from 'lucide-react';
import PageContainer from '@/components/shared/PageContainer';
import MandiSelector from '@/components/shared/MandiSelector';
import MandiPriceTicker from '@/components/shared/MandiPriceTicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { Mandi } from '@/types';
import { getMandis } from '@/lib/mandi-service';
import {
  COMMODITIES,
  CommodityCategory,
  CommodityItem,
  MandiCropPrice,
  getMandiPrices,
  getSellingAdvisory,
  SellingAdvisoryResult,
} from '@/lib/mandi-price-service';

export default function MandiPricesAdvisorPage() {
  const { language } = useLanguage();

  // 1. Mandi Selection State
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [loadingMandis, setLoadingMandis] = useState(true);
  const [selectedMandiId, setSelectedMandiId] = useState<string>('');

  // Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompting' | 'granted' | 'denied' | 'error'>('prompting');
  const [locationError, setLocationError] = useState<string | null>(null);

  // 2. Prices Listing State
  const [prices, setPrices] = useState<MandiCropPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | CommodityCategory>('all');

  // 3. Advisor Input State
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('wheat');
  const [quantityInput, setQuantityInput] = useState<string>('20');
  const [advisoryResult, setAdvisoryResult] = useState<SellingAdvisoryResult | null>(null);
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);

  // Load Mandis list & geolocation on mount
  const requestLocation = () => {
    setLocationStatus('prompting');
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      setLocationError('Geolocation not supported by browser.');
      loadMandis(undefined, undefined);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocationStatus('granted');
        loadMandis(coords.lat, coords.lng);
      },
      (err) => {
        setLocationStatus('denied');
        setLocationError(err.message || 'Location access denied.');
        loadMandis(undefined, undefined);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const loadMandis = async (lat?: number, lng?: number) => {
    setLoadingMandis(true);
    try {
      const list = await getMandis(lat, lng);
      setMandis(list);
      if (list.length > 0 && !selectedMandiId) {
        setSelectedMandiId(list[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMandis(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const selectedMandi = useMemo(() => {
    return mandis.find((m) => m.id === selectedMandiId) || mandis[0] || null;
  }, [mandis, selectedMandiId]);

  // Load prices whenever selected mandi changes
  useEffect(() => {
    if (!selectedMandi?.id) return;
    setLoadingPrices(true);
    getMandiPrices(selectedMandi.id)
      .then((data) => {
        setPrices(data);
      })
      .catch(() => setPrices([]))
      .finally(() => setLoadingPrices(false));
  }, [selectedMandi?.id]);

  // Compute Selling Advisory when inputs change
  useEffect(() => {
    if (!selectedMandi?.id || !selectedCommodityId) return;
    const qty = Math.max(1, Number(quantityInput) || 10);
    setLoadingAdvisory(true);
    getSellingAdvisory(selectedCommodityId, qty, selectedMandi.id, userLocation)
      .then((res) => {
        setAdvisoryResult(res);
      })
      .catch(() => setAdvisoryResult(null))
      .finally(() => setLoadingAdvisory(false));
  }, [selectedMandi?.id, selectedCommodityId, quantityInput, userLocation]);

  // Group prices by category
  const categories: { id: CommodityCategory; label: string; icon: any }[] = [
    { id: 'grains_cereals', label: t('price.catGrains', language), icon: Wheat },
    { id: 'pulses', label: t('price.catPulses', language), icon: Layers },
    { id: 'vegetables', label: t('price.catVegetables', language), icon: Carrot },
    { id: 'fruits', label: t('price.catFruits', language), icon: Apple },
  ];

  const filteredPrices = useMemo(() => {
    if (activeCategoryFilter === 'all') return prices;
    return prices.filter((p) => p.category === activeCategoryFilter);
  }, [prices, activeCategoryFilter]);

  const handleSelectCropForAdvisor = (commodityId: string) => {
    setSelectedCommodityId(commodityId);
    // Smooth scroll down to advisor section
    const el = document.getElementById('selling-advisor-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto pb-16">
        {/* Page Heading & Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('advisor.badge', language)}</span>
            </div>
            <h1 className="display-font text-4xl sm:text-5xl text-primary-950 mt-1">
              {t('advisor.pageTitle', language)}
            </h1>
            <p className="text-primary-700 mt-2 max-w-2xl text-base">
              {t('advisor.pageSubtitle', language)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/slot-booking"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
            >
              <span>{t('nav.slotBooking', language)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* SECTION 1: MANDI SELECTOR (Nearest-Mandi Selector) */}
        <div className="mb-8">
          <MandiSelector
            mandis={mandis}
            selectedMandiId={selectedMandiId}
            onSelectMandi={(id) => setSelectedMandiId(id)}
            userLocation={userLocation}
            locationStatus={locationStatus}
            locationError={locationError}
            onRequestLocation={requestLocation}
            loading={loadingMandis}
            quantityQuintals={Number(quantityInput) || 20}
            title={t('advisor.selectMandiTitle', language)}
            subtitle={t('advisor.selectMandiHeading', language)}
          />
        </div>

        {/* SECTION 2: MARQUEE OF LATEST CROP PRICES */}
        {selectedMandi && (
          <MandiPriceTicker prices={prices} mandiName={selectedMandi.name} />
        )}

        {/* SECTION 3: CURRENT PRICE LISTING (Grouped by Category) */}
        <section className="bg-white/95 border border-primary-200 rounded-[2rem] shadow-md p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary-100 pb-5 mb-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-primary-600 font-bold">
                {selectedMandi ? selectedMandi.name : t('nav.apmcYard', language)}
              </span>
              <h2 className="text-2xl font-bold text-primary-950 mt-0.5">
                {t('price.liveRatesTitle', language)}
              </h2>
              <p className="text-xs text-primary-600 mt-0.5">
                {t('price.liveRatesSubtitle', language)}
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategoryFilter === 'all'
                    ? 'bg-primary-900 text-white shadow-sm'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                {t('common.all', language) || 'All'}
              </button>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isCatActive = activeCategoryFilter === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setActiveCategoryFilter(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCatActive
                        ? 'bg-primary-900 text-white shadow-sm'
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Grid */}
          {loadingPrices ? (
            <div className="py-12 text-center text-primary-600">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">{t('common.loading', language)}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrices.map((item) => {
                const isPerishable = item.perishability === 'high';
                const isMedium = item.perishability === 'medium';
                const isSelectedForAdvice = selectedCommodityId === item.commodityId;

                return (
                  <div
                    key={item.commodityId}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      isSelectedForAdvice
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-primary-100 bg-white hover:border-primary-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-primary-100 text-primary-800">
                          {t(`price.cat_${item.category}`, language) || item.category}
                        </span>

                        {isPerishable ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-red-600" />
                            {t('advisor.perishableHigh', language)}
                          </span>
                        ) : isMedium ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            {t('advisor.perishableMedium', language)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {t('advisor.perishableLow', language)}
                          </span>
                        )}
                      </div>

                      {/* Commodity Name & Modal Price */}
                      <h3 className="text-base font-bold text-primary-950 leading-tight">
                        {item.commodityName}
                      </h3>

                      <div className="mt-2.5 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-primary-500 uppercase block font-semibold">
                            {t('price.modalRate', language)}
                          </span>
                          <span className="text-2xl font-extrabold text-primary-950">
                            ₹{item.modalPrice.toLocaleString('en-IN')}
                            <small className="text-xs font-normal text-primary-600 ml-1">/Qtl</small>
                          </span>
                        </div>

                        <div className="text-right">
                          {item.trend24h > 0 ? (
                            <span className="inline-flex items-center text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{item.trend24h}%
                            </span>
                          ) : item.trend24h < 0 ? (
                            <span className="inline-flex items-center text-xs font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />{item.trend24h}%
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-primary-500">0.0%</span>
                          )}
                        </div>
                      </div>

                      {/* Min / Max Range & Arrivals */}
                      <div className="mt-3 pt-2.5 border-t border-primary-100 flex items-center justify-between text-[11px] text-primary-600">
                        <span>Range: ₹{item.minPrice} – ₹{item.maxPrice}</span>
                        <span>Arrival: {item.arrivalsQuintals} Qtl</span>
                      </div>
                    </div>

                    {/* Quick Button to Advise */}
                    <button
                      type="button"
                      onClick={() => handleSelectCropForAdvisor(item.commodityId)}
                      className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isSelectedForAdvice
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-primary-100 text-primary-800 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      <span>{t('advisor.analyzeThisCrop', language)}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 4: FARMER INPUT AND SELLING ADVISOR (Below Listing) */}
        <section id="selling-advisor-section" className="scroll-mt-20">
          <div className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950 text-white border border-white/10 rounded-[2rem] shadow-xl p-6 sm:p-9 relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{t('advisor.engineTitle', language)}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {t('advisor.engineHeading', language)}
                  </h2>
                </div>
                <div className="text-xs text-primary-300 max-w-xs">
                  {t('advisor.engineSubtitle', language)}
                </div>
              </div>

              {/* Form Input: Crop Selection & Quantity in Quintals */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10">
                {/* Crop Selector */}
                <div>
                  <label className="block text-xs font-bold text-primary-200 mb-1.5 uppercase tracking-wider">
                    {t('advisor.selectCropLabel', language)}
                  </label>
                  <select
                    value={selectedCommodityId}
                    onChange={(e) => setSelectedCommodityId(e.target.value)}
                    className="w-full bg-primary-900 border border-white/20 text-white rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-400"
                  >
                    {COMMODITIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-primary-950 text-white">
                        {c.defaultName} ({t(`price.cat_${c.category}`, language) || c.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input in Quintals */}
                <div>
                  <label className="block text-xs font-bold text-primary-200 mb-1.5 uppercase tracking-wider">
                    {t('advisor.quantityLabel', language)}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full bg-primary-900 border border-white/20 text-white rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-emerald-400 pr-16"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-emerald-400 uppercase">
                      Quintals
                    </span>
                  </div>
                </div>

                {/* Perishability Indicator Banner */}
                {advisoryResult && (
                  <div className="sm:col-span-2 lg:col-span-1 bg-black/30 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        advisoryResult.commodity.perishability === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : advisoryResult.commodity.perishability === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {advisoryResult.commodity.perishability === 'high' ? (
                        <Flame className="w-5 h-5" />
                      ) : (
                        <Leaf className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-primary-300 block uppercase font-bold">
                        {t('advisor.storabilityRating', language)}
                      </span>
                      <strong className="text-xs text-white">
                        {advisoryResult.commodity.shelfLifeDays} Days Shelf Life
                      </strong>
                      <p className="text-[10px] text-primary-300/80 line-clamp-1">
                        {advisoryResult.commodity.perishabilityNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ADVISORY RESULTS CONTAINER */}
              {loadingAdvisory ? (
                <div className="py-16 text-center text-primary-300">
                  <div className="w-9 h-9 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold">{t('advisor.computingAnalysis', language)}</p>
                </div>
              ) : advisoryResult ? (
                <div className="space-y-6">
                  {/* MAIN RECOMMENDATION BANNER */}
                  <div
                    className={`p-6 rounded-2xl border-2 transition-all shadow-lg relative overflow-hidden ${
                      advisoryResult.recommendation === 'SELL_NOW'
                        ? advisoryResult.isPerishabilityOverride
                          ? 'bg-gradient-to-r from-red-950/90 via-red-900/60 to-red-950/90 border-red-500/70 text-red-100'
                          : 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-emerald-950/90 border-emerald-500/70 text-emerald-100'
                        : 'bg-gradient-to-r from-indigo-950/90 via-indigo-900/60 to-indigo-950/90 border-indigo-500/70 text-indigo-100'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              advisoryResult.recommendation === 'SELL_NOW'
                                ? 'bg-red-500 text-white shadow-sm'
                                : 'bg-indigo-400 text-indigo-950 shadow-sm'
                            }`}
                          >
                            {advisoryResult.recommendation === 'SELL_NOW'
                              ? t('advisor.badgeSellNow', language)
                              : t('advisor.badgeHoldHarvest', language)}
                          </span>

                          {advisoryResult.isPerishabilityOverride && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600/30 border border-red-400 text-red-300 animate-pulse">
                              {t('advisor.perishabilityOverride', language)}
                            </span>
                          )}

                          <span className="text-xs text-white/80 font-semibold">
                            Confidence: {advisoryResult.confidence}
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          {advisoryResult.headline}
                        </h3>

                        {advisoryResult.perishabilityWarning && (
                          <div className="mt-2.5 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>{advisoryResult.perishabilityWarning}</span>
                          </div>
                        )}
                      </div>

                      {/* Best Mandi Net Payout Card */}
                      <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 text-right min-w-[220px]">
                        <span className="text-[10px] text-primary-200 block uppercase font-bold">
                          {t('advisor.highestNetReturn', language)}
                        </span>
                        <div className="text-2xl font-extrabold text-white mt-0.5">
                          ₹{advisoryResult.bestMandi.netRevenue.toLocaleString('en-IN')}
                        </div>
                        <span className="text-xs text-emerald-300 font-semibold block mt-0.5">
                          at {advisoryResult.bestMandi.mandiName}
                        </span>
                        <small className="text-[10px] text-white/70 block">
                          After ₹{advisoryResult.bestMandi.transportCost.toLocaleString('en-IN')} transport
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* 3-COLUMN METRICS: CROSS-MANDI COMPARISON | HISTORICAL PEAKS | FUTURE PREDICTION */}
                  <div className="grid lg:grid-cols-3 gap-5">
                    {/* 1. Cross-Mandi Price Comparison */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            <span>{t('advisor.crossMandiTitle', language)}</span>
                          </h4>
                          <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                            {advisoryResult.crossMandiComparison.length} APMC Yards
                          </span>
                        </div>

                        <p className="text-xs text-primary-300 mb-3">
                          {t('advisor.crossMandiDesc', language)}
                        </p>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                          {advisoryResult.crossMandiComparison.map((cm) => (
                            <div
                              key={cm.mandiId}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                cm.isHighestNet
                                  ? 'bg-emerald-500/15 border-emerald-400 text-white'
                                  : 'bg-white/5 border-white/5 text-primary-200'
                              }`}
                            >
                              <div>
                                <strong className="font-bold block text-white text-xs">
                                  {cm.mandiName}
                                  {cm.isHighestNet && (
                                    <span className="ml-1.5 text-[9px] bg-emerald-400 text-primary-950 px-1.5 py-0.2 rounded font-black uppercase">
                                      Best Net
                                    </span>
                                  )}
                                </strong>
                                <span className="text-[10px] text-primary-400">
                                  ₹{cm.pricePerQuintal}/Qtl • {cm.distanceKm} km
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-emerald-300 block">
                                  ₹{cm.netRevenue.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[9px] text-primary-400">
                                  -₹{cm.transportCost} trans.
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 2. Multi-Year Historical Peak Comparison */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            <span>{t('advisor.historyTitle', language)}</span>
                          </h4>
                          <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded font-bold">
                            2023 – 2025 Data
                          </span>
                        </div>

                        <div className="bg-black/30 p-3 rounded-xl border border-white/10 mb-3 text-xs">
                          <span className="text-[10px] text-primary-300 uppercase block font-bold">
                            {t('advisor.typicalPeakWindow', language)}
                          </span>
                          <strong className="text-amber-300 text-sm font-extrabold">
                            {advisoryResult.historicalPeaks.typicalPeakPeriod}
                          </strong>
                        </div>

                        <div className="space-y-2 text-xs">
                          {advisoryResult.historicalPeaks.years.map((y) => (
                            <div
                              key={y.year}
                              className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-white">{y.year} Season</span>
                                <small className="text-[10px] text-primary-300 block line-clamp-1">
                                  {y.peakPeriod}
                                </small>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-amber-300 block">
                                  Peak: ₹{y.peakPrice.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-primary-400">
                                  Avg: ₹{y.averagePrice.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-primary-300/80 mt-3 pt-2 border-t border-white/10">
                        {advisoryResult.historicalPeaks.comparisonSummary}
                      </p>
                    </div>

                    {/* 3. Future Price Prediction & Festive Demand */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span>{t('advisor.forecastTitle', language)}</span>
                          </h4>
                          <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                            15 & 30 Day Models
                          </span>
                        </div>

                        {/* Forecast Cards */}
                        <div className="grid grid-cols-2 gap-2.5 mb-3">
                          <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                            <span className="text-[10px] text-primary-300 uppercase block font-bold">
                              15-Day Target
                            </span>
                            <div className="text-base font-extrabold text-white mt-0.5">
                              ₹{advisoryResult.futureForecast.days15Price.toLocaleString('en-IN')}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                advisoryResult.futureForecast.days15ChangePct >= 0
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {advisoryResult.futureForecast.days15ChangePct >= 0 ? '+' : ''}
                              {advisoryResult.futureForecast.days15ChangePct}% trajectory
                            </span>
                          </div>

                          <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                            <span className="text-[10px] text-primary-300 uppercase block font-bold">
                              30-Day Target
                            </span>
                            <div className="text-base font-extrabold text-white mt-0.5">
                              ₹{advisoryResult.futureForecast.days30Price.toLocaleString('en-IN')}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                advisoryResult.futureForecast.days30ChangePct >= 0
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {advisoryResult.futureForecast.days30ChangePct >= 0 ? '+' : ''}
                              {advisoryResult.futureForecast.days30ChangePct}% trajectory
                            </span>
                          </div>
                        </div>

                        {/* Festive Season Alert */}
                        {advisoryResult.festivalInsight && (
                          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs">
                            <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-1">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <span>{advisoryResult.festivalInsight.upcomingFestival}</span>
                            </div>
                            <p className="text-[11px] text-purple-200">
                              {advisoryResult.festivalInsight.expectedPriceImpact}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-primary-300">
                        <span>Model Accuracy: {advisoryResult.futureForecast.confidenceScore}%</span>
                        <span className="text-emerald-400">Seasonal Indexing Active</span>
                      </div>
                    </div>
                  </div>

                  {/* DETAILED REASONING & ACTIONABLE SUMMARY */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-emerald-400" />
                      <span>{t('advisor.reasoningTitle', language)}</span>
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-3 text-xs text-primary-200">
                      {advisoryResult.reasoningPoints.map((pt, idx) => (
                        <div
                          key={idx}
                          className="bg-black/25 p-3 rounded-xl border border-white/5 flex items-start gap-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{pt}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-primary-300">
                        Ready to secure your unloading time slot at{' '}
                        <strong className="text-white">{advisoryResult.bestMandi.mandiName}</strong>?
                      </div>

                      <Link
                        href={`/slot-booking?mandi=${advisoryResult.bestMandi.mandiId}&crop=${encodeURIComponent(
                          advisoryResult.commodity.defaultName
                        )}&qty=${advisoryResult.quantityQuintals}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-primary-950 font-bold text-xs shadow-md transition-all"
                      >
                        <span>{t('advisor.bookSlotAtBestMandi', language)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
