'use client';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

type UtmKey = (typeof UTM_KEYS)[number];
type UtmPayload = Partial<Record<UtmKey, string>>;

const safeSessionStorage = {
  getItem(key: string) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // ignore storage access errors
    }
  },
};

const getCurrentUtmPayload = (): UtmPayload => {
  if (typeof window === 'undefined') return {};

  return UTM_KEYS.reduce<UtmPayload>((acc, key) => {
    const value = safeSessionStorage.getItem(key);
    if (value) acc[key] = value;
    return acc;
  }, {});
};

export const persistUtmParams = () => {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      safeSessionStorage.setItem(key, value);
    }
  });
};

export const trackMetaPageView = () => {
  if (typeof window === 'undefined') return;

  const payload = getCurrentUtmPayload();
  console.log('[Meta Pixel] PageView', payload);

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

export const trackMetaCustomEvent = (eventName: string, payload: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') return;

  const mergedPayload = {
    ...payload,
    ...getCurrentUtmPayload(),
  };

  console.log('[Meta Pixel] Custom Event', eventName, mergedPayload);

  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, mergedPayload);
  }
};
