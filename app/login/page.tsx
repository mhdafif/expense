"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { mapApiErrorKey } from "@/lib/api-error-map";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/auth/get-session", { cache: "no-store" });
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (json?.user) {
          router.replace("/dashboard");
          return;
        }
      } finally {
        setCheckingSession(false);
      }
    };
    run().catch(() => setCheckingSession(false));
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let json: { message?: string; error?: { message?: string } } | null = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      if (!res.ok) {
        const backendMessage = String(json?.message || json?.error?.message || "");
        throw new Error(t(mapApiErrorKey(backendMessage, "auth.loginFailed")));
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <main className="mx-auto max-w-md px-4 py-10 text-sm text-slate-500">{t("auth.checkingSession")}</main>;
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">{t("auth.loginTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("auth.loginSubtitle")}</p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.email")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.password")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-2 text-white disabled:opacity-60"
          >
            {loading ? t("auth.loginLoading") : t("auth.loginButton")}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <p className="mt-4 text-sm text-slate-600">
          {t("auth.noAccount")} <Link className="text-indigo-600 underline" href="/register">{t("auth.registerButton")}</Link>
        </p>
      </div>
    </main>
  );
}
