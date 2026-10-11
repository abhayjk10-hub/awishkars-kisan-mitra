'use client';

import { useCallback } from 'react';
import { Clock, MapPin, X } from 'lucide-react';
import { useToken, type TokenStatus } from '@/contexts/TokenContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

function getStatusLabel(status: TokenStatus, ahead: number, lang: any): string {
  if (status === 'completed') return `✅ ${t('token.statusCompleted', lang)}`;
  if (status === 'no-show') return `⚠️ ${t('slot.delayWarning', lang)}`;
  if (status === 'cancelled') return `❌ ${t('slot.statusCancelled', lang)}`;
  if (status === 'waitlisted') return `⏳ ${t('slot.statusWaitlisted', lang)}`;
  if (status === 'now') return `🚨 ${t('token.statusCalled', lang)}`;
  if (status === 'approaching') return `⚡ ${t('token.statusWeighing', lang)} (${ahead})`;
  return `${ahead} ${t('token.statusWaiting', lang)}`;
}

function getStatusColor(status: TokenStatus): string {
  if (status === 'completed') return 'bg-emerald-900 border-emerald-500 text-white';
  if (status === 'no-show' || status === 'cancelled') return 'bg-red-950 border-red-500 text-red-200';
  if (status === 'waitlisted') return 'bg-amber-950 border-amber-500 text-amber-200';
  if (status === 'now') return 'token-marquee--now';
  if (status === 'approaching') return 'token-marquee--approaching';
  return 'token-marquee--waiting';
}


export default function TokenMarquee() {
  const { token, clearToken } = useToken();
  const { language } = useLanguage();

  const handleDismiss = useCallback(() => {
    if (token?.status === 'now' || token?.status === 'approaching') {
      if (!window.confirm('Dismiss token tracking?')) return;
    }
    clearToken();
  }, [token, clearToken]);

  if (!token) return null;

  const statusLabel = getStatusLabel(token.status, token.totalAhead, language);
  const colorClass = getStatusColor(token.status);

  return (
    <div
      className={`token-marquee ${colorClass}`}
      role="status"
      aria-live="polite"
      aria-label={`Token tracking: ${statusLabel}`}
    >
      <div className="token-marquee-inner">
        {/* Token number */}
        <div className="token-marquee-token">
          <span className="token-marquee-label">{t('token.number', language)}</span>
          <strong className="token-marquee-number">#{token.tokenNumber}</strong>
        </div>

        <div className="token-marquee-divider" aria-hidden="true" />

        {/* Mandi */}
        <div className="token-marquee-info">
          <MapPin />
          <span>{token.mandiName}</span>
        </div>

        {/* Date and Day of Week */}
        {token.bookingDate && (
          <>
            <div className="token-marquee-divider" aria-hidden="true" />
            <div className="token-marquee-info">
              <span>📅 {token.dayOfWeek ? `${token.dayOfWeek}, ` : ''}{token.bookingDate}</span>
            </div>
          </>
        )}

        <div className="token-marquee-divider" aria-hidden="true" />

        {/* Slot time */}
        <div className="token-marquee-info">
          <Clock />
          <span>{t('slot.summaryWindow', language)}: {token.slotTime}</span>
        </div>

        <div className="token-marquee-divider" aria-hidden="true" />

        {/* Status — scrolling on mobile */}
        <div className="token-marquee-status">
          <span className="token-marquee-pulse" aria-hidden="true" />
          <span>{statusLabel}</span>
        </div>

        {/* Wait estimate */}
        {token.status !== 'now' && token.estimatedWaitMinutes > 0 && (
          <>
            <div className="token-marquee-divider" aria-hidden="true" />
            <div className="token-marquee-wait">
              ~{token.estimatedWaitMinutes} min
            </div>
          </>
        )}

        {/* Dismiss */}
        <button
          type="button"
          className="token-marquee-dismiss"
          onClick={handleDismiss}
          aria-label={t('common.dismiss', language)}
          title={t('common.dismiss', language)}
        >
          <X />
        </button>
      </div>
    </div>
  );
}
