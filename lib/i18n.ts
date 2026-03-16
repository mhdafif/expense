import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "@/locales/en/common.json";
import idCommon from "@/locales/id/common.json";

export const I18N_STORAGE_KEY = "expense.lang";
export const I18N_COOKIE_KEY = "expense.lang";

export const resources = {
  en: { common: enCommon },
  id: { common: idCommon },
} as const;

export type AppLanguage = keyof typeof resources;

function detectLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";

  const fromStorage = window.localStorage.getItem(I18N_STORAGE_KEY);
  if (fromStorage === "en" || fromStorage === "id") return fromStorage;

  const cookieValue = document.cookie
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${I18N_COOKIE_KEY}=`))
    ?.split("=")[1];
  if (cookieValue === "en" || cookieValue === "id") return cookieValue;

  const browser = (navigator.language || "en").toLowerCase();
  if (browser.startsWith("id")) return "id";
  return "en";
}

export function persistLanguage(lang: AppLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(I18N_STORAGE_KEY, lang);
  document.cookie = `${I18N_COOKIE_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });
}

export default i18n;
