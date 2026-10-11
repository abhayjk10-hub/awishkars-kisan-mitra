'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type TokenStatus = 'waiting' | 'approaching' | 'now' | 'completed' | 'no-show' | 'waitlisted' | 'cancelled' | null;

export interface TokenData {
  tokenNumber: string;
  mandiName: string;
  currentToken: number;
  totalAhead: number;
  status: TokenStatus;
  estimatedWaitMinutes: number;
  slotTime: string;
  bookingDate?: string;
  dayOfWeek?: string;
  cropName?: string;
  quantity?: number;
  bookingId?: string;
  farmerPhone?: string;
}

interface TokenContextType {
  token: TokenData | null;
  setToken: (data: TokenData | null) => void;
  clearToken: () => void;
}

const TokenContext = createContext<TokenContextType>({
  token: null,
  setToken: () => {},
  clearToken: () => {},
});

const TOKEN_STORAGE_KEY = 'kisan_mitra_token';

export function TokenProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<TokenData | null>(null);

  // Restore token from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TokenData;
        setTokenState(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen to live updates if bookingId exists
  useEffect(() => {
    if (!token?.bookingId) return;
    
    // Import dynamically or use event listener
    const handleUpdate = (e: any) => {
      const payload = e.detail?.payload || e.data?.payload;
      if (payload?.bookingId === token.bookingId || payload?.id === token.bookingId) {
        const newStatus = payload.status;
        let mappedStatus: TokenStatus = token.status;
        if (newStatus === 'active') mappedStatus = 'now';
        else if (newStatus === 'completed') mappedStatus = 'completed';
        else if (newStatus === 'no-show') mappedStatus = 'no-show';
        else if (newStatus === 'waiting') mappedStatus = 'waiting';
        else if (newStatus === 'waitlisted') mappedStatus = 'waitlisted';
        else if (newStatus === 'cancelled') mappedStatus = 'cancelled';

        setTokenState((prev) => {
          if (!prev) return null;
          const updated: TokenData = {
            ...prev,
            status: mappedStatus,
            totalAhead: mappedStatus === 'now' ? 0 : prev.totalAhead,
            estimatedWaitMinutes: mappedStatus === 'now' ? 0 : prev.estimatedWaitMinutes,
          };
          try { localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    };

    window.addEventListener('km_sync_event', handleUpdate);
    return () => window.removeEventListener('km_sync_event', handleUpdate);
  }, [token?.bookingId]);


  const setToken = useCallback((data: TokenData | null) => {
    setTokenState(data);
    try {
      if (data) {
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  const clearToken = useCallback(() => {
    setTokenState(null);
    try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <TokenContext.Provider value={{ token, setToken, clearToken }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useToken() {
  return useContext(TokenContext);
}
