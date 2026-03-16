"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { mapApiErrorKey } from "@/lib/api-error-map";

export default function JoinWorkspacePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [status, setStatus] = useState(t("join.processing"));

  useEffect(() => {
    const run = async () => {
      const token = params?.token;
      if (!token) {
        setStatus(t("join.invalidToken"));
        return;
      }

      const res = await fetch(`/api/v1/invites/${token}/accept`, { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        const backendMessage = json?.error?.message as string | undefined;
        setStatus(t(mapApiErrorKey(backendMessage, "join.failed")));
        return;
      }

      setStatus(t("join.success"));
      setTimeout(() => router.replace("/dashboard"), 800);
    };

    run().catch(() => setStatus(t("join.error")));
  }, [params?.token, router, t]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-lg font-bold text-slate-800">{t("join.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{status}</p>
      </div>
    </main>
  );
}
