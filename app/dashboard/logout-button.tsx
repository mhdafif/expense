"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } finally {
      router.replace("/login");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
    >
      {loading ? "Logout..." : "Logout"}
    </button>
  );
}
