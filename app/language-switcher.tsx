"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, { AppLanguage, persistLanguage } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const [lang, setLang] = useState<AppLanguage>((i18n.language as AppLanguage) || "en");

  useEffect(() => {
    const onChanged = (nextLang: string) => setLang((nextLang as AppLanguage) || "en");
    i18n.on("languageChanged", onChanged);
    return () => {
      i18n.off("languageChanged", onChanged);
    };
  }, []);

  const onChange = async (nextLang: AppLanguage) => {
    persistLanguage(nextLang);
    await i18n.changeLanguage(nextLang);
  };

  return (
    <div className="fixed right-3 top-3 z-50 rounded-xl border border-slate-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur">
      <label className="mr-2 text-xs text-slate-500">{t("app.language")}</label>
      <select
        value={lang}
        onChange={(e) => onChange(e.target.value as AppLanguage)}
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
      >
        <option value="en">{t("lang.en")}</option>
        <option value="id">{t("lang.id")}</option>
      </select>
    </div>
  );
}
