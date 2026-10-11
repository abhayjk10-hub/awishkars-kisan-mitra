'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Clock3, MapPin, Phone, Sprout } from 'lucide-react';
import FieldMotion from '@/components/shared/FieldMotion';
import { MagneticLink, ParallaxPanel, ScrollReveal } from '@/components/shared/ArchiveMotion';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import MarketPulse from '@/components/home/MarketPulse';
import FarmerChatbot from '@/components/home/FarmerChatbot';
import GovernmentSchemes from '@/components/home/GovernmentSchemes';

export default function HomePageContent() {
  const { language } = useLanguage();
  const services = [
    { number: '01', title: t('home.register', language), detail: t('home.registerDetail', language), href: '/login' },
    { number: '02', title: t('home.reserve', language), detail: t('home.reserveDetail', language), href: '/slot-booking' },
    { number: '03', title: t('home.arrive', language), detail: t('home.arriveDetail', language), href: '/contact' },
  ];

  return (
    <main className="archive-page">
      <section className="archive-hero">
        <FieldMotion className="archive-video" />
        <div className="archive-shade" /><div className="archive-grain" />
        <div className="archive-hero-inner">
          <div className="archive-kicker"><span className="archive-dot" /> {t('home.kicker', language)} <span className="archive-line" /> {t('home.network', language)}</div>
          <div className="archive-title-wrap"><p className="archive-vertical">{t('home.vertical', language)}</p><h1 className="archive-title">{t('home.title', language)}</h1><div className="archive-title-orbit" aria-hidden="true"><Sprout /><span>{t('home.farmerFirst', language).split('\n').map((line) => <span key={line}>{line}<br /></span>)}</span></div></div>
          <div className="archive-hero-footer"><p className="whitespace-pre-line">{t('home.heroText', language)}</p><MagneticLink href="/login" className="archive-cta">{t('home.enter', language)} <ArrowUpRight /></MagneticLink><span className="archive-scroll"><ChevronDown /> {t('home.scroll', language)}</span></div>
        </div>
      </section>

      <ScrollReveal className="archive-intro" id="explore"><div className="archive-index">/ 001 — {t('home.signalLabel', language)}</div><div className="archive-intro-copy"><p className="archive-eyebrow">{t('home.introEyebrow', language)}</p><h2>{t('home.introTitle', language)}</h2><p className="archive-muted">{t('home.introBody', language)}</p></div><div className="archive-signal-card"><div className="signal-radar"><span /><span /><span /><div className="signal-core" /></div><p>{t('home.signalLabel', language)}</p><strong>{t('home.signalTitle', language)}</strong><span className="signal-status"><i /> {t('home.signalStatus', language)}</span></div></ScrollReveal>
      <ScrollReveal className="archive-services"><div className="archive-index">/ 002 — {t('home.route', language)}</div><div className="archive-service-list">{services.map((service) => <Link href={service.href} className="archive-service" key={service.number}><span className="service-number">{service.number}</span><h3>{service.title}</h3><p>{service.detail}</p><ArrowUpRight className="service-arrow" /></Link>)}</div></ScrollReveal>

      <MarketPulse />

      <ScrollReveal className="archive-feature"><ParallaxPanel className="archive-feature-image"><div className="feature-image-shade" /><p className="feature-label">{t('home.featureLabel', language)}</p><div className="feature-caption"><span>01</span><strong>{t('home.featureCaption', language)}</strong></div></ParallaxPanel><div className="archive-feature-copy"><div className="archive-index">/ 003 — {t('home.ready', language)}</div><h2>{t('home.featureTitle', language)}</h2><div className="feature-stat"><Clock3 /><span><strong>{t('home.hours', language)}</strong><small>{t('home.hoursDetail', language)}</small></span></div><div className="feature-stat"><MapPin /><span><strong>{t('home.apmc', language)}</strong><small>{t('home.apmcDetail', language)}</small></span></div><Link href="/slot-booking" className="archive-text-link">{t('home.available', language)} <ArrowUpRight /></Link></div></ScrollReveal>

      <GovernmentSchemes />

      <ScrollReveal className="archive-footer-cta"><div><p className="archive-eyebrow">{t('home.footerEyebrow', language)}</p><h2>{t('home.footerTitle', language)}</h2></div><div className="footer-cta-actions"><MagneticLink href="/login" className="archive-cta">{t('home.getStarted', language)} <ArrowUpRight /></MagneticLink><a href="tel:1800-180-1551" className="archive-phone"><Phone /> 1800-180-1551</a></div></ScrollReveal>
      <FarmerChatbot />
    </main>
  );
}
