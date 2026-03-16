"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [token, setToken] = useState("");

  const [password, setPassword] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const backend = String(json?.message || "").toLowerCase();
        if (backend.includes("token")) throw new Error(t("auth.resetTokenInvalid"));
        throw new Error(json?.message || t("auth.resetPasswordFailed"));
      }

      setMessage(t("auth.resetPasswordSuccess"));
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.resetPasswordFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <p className="text-sm text-rose-600">{t("auth.resetTokenMissing")}</p>
        <p className="mt-2 text-sm text-slate-600">
          <Link className="text-indigo-600 underline" href="/forgot-password">{t("auth.forgotPassword")}</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">{t("auth.resetPasswordTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("auth.resetPasswordSubtitle")}</p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.newPassword")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-2 text-white disabled:opacity-60"
          >
            {loading ? t("auth.saving") : t("auth.resetPasswordButton")}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <p className="mt-4 text-sm text-slate-600">
          <Link className="text-indigo-600 underline" href="/login">{t("auth.loginButton")}</Link>
        </p>
      </div>
    </main>
  );
}
