"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JoinWorkspacePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState("Memproses undangan...");

  useEffect(() => {
    const run = async () => {
      const token = params?.token;
      if (!token) {
        setStatus("Token invite tidak valid");
        return;
      }

      const res = await fetch(`/api/v1/invites/${token}/accept`, { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        setStatus(json?.error?.message || "Gagal join workspace");
        return;
      }

      setStatus("Berhasil join workspace. Mengarahkan ke dashboard...");
      setTimeout(() => router.replace("/dashboard"), 800);
    };

    run().catch(() => setStatus("Terjadi kesalahan saat menerima invite"));
  }, [params?.token, router]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-lg font-bold text-slate-800">Join Workspace</h1>
        <p className="mt-2 text-sm text-slate-600">{status}</p>
      </div>
    </main>
  );
}
