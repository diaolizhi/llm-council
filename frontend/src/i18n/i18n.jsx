import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALES, DEFAULT_LOCALE, STORAGE_KEY } from './constants';
import { TRANSLATIONS } from './translations';

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, vars) => applyTemplate(key, vars)
});

function applyTemplate(text, vars = {}) {
  return text.replace(/{{\s*(\w+)\s*}}/g, (_, name) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      return vars[name];
    }
    return '';
  });
}

function detectBrowserLocale() {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const language = navigator.language || (navigator.languages && navigator.languages[0]);
  if (language && language.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  return DEFAULT_LOCALE;
}

function loadInitialLocale() {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALES.includes(stored)) {
      return stored;
    }
  } catch (error) {
    // Ignore storage errors and fall back to detection
  }

  return detectBrowserLocale();
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(loadInitialLocale);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch (error) {
      // Ignore storage errors to avoid breaking UI
    }
  }, [locale]);

  const translate = (key, vars) => {
    const translation =
      (TRANSLATIONS[locale] && TRANSLATIONS[locale][key]) ||
      (TRANSLATIONS[DEFAULT_LOCALE] && TRANSLATIONS[DEFAULT_LOCALE][key]);

    if (!translation) {
      console.warn(`Missing translation for key "${key}" (locale: ${locale})`);
      return key;
    }

    return applyTemplate(translation, vars);
  };

  const setLocale = (nextLocale) => {
    if (LOCALES.includes(nextLocale)) {
      setLocaleState(nextLocale);
    }
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: translate
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
