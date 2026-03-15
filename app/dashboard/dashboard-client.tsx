"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PaymentMethod } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Expense = {
  id: string;
  title: string;
  amount: string | number;
  category: string;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  note?: string | null;
};

type EditForm = {
  title: string;
  amount: string;
  category: string;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  note: string;
};

type UiNotice = {
  type: "success" | "error";
  message: string;
};

type WorkspaceMembership = {
  workspaceId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  workspaceName: string;
};

type WorkspaceInvite = {
  id: string;
  role: "EDITOR" | "VIEWER";
  token: string;
  expiresAt: string;
  url: string;
};

const categoryOptions = ["Food", "Transport", "Groceries", "Bills", "Shopping", "Health", "Other"];

function nowInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalDateInput(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseMonthInput(monthInput: string) {
  return {
    year: Number(monthInput.slice(0, 4)),
    month: Number(monthInput.slice(5, 7)),
  };
}

function parsePeriodFromDate(dateInput: string) {
  const d = new Date(dateInput);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
  };
}

async function readApiResponse(res: Response) {
  const raw = await res.text();
  try {
    return { raw, json: raw ? JSON.parse(raw) : null } as const;
  } catch {
    return { raw, json: null } as const;
  }
}

function useExpenses(workspaceId: string, month: string, category: string) {
  return useQuery({
    queryKey: ["expenses", workspaceId, month, category],
    queryFn: async () => {
      const params = new URLSearchParams({ year: month.slice(0, 4), month: String(Number(month.slice(5, 7))) });
      if (category) params.set("category", category);

      const res = await fetch(`/api/v1/workspaces/${workspaceId}/expenses?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Gagal mengambil data");
      }
      return (json?.data?.items || []) as Expense[];
    },
  });
}

export default function DashboardClient({
  workspaceId: initialWorkspaceId,
  workspaceName,
  memberships,
}: {
  workspaceId: string;
  workspaceName: string;
  memberships: WorkspaceMembership[];
}) {
  const queryClient = useQueryClient();

  const monthDefault = useMemo(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [month, setMonth] = useState(monthDefault);
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<UiNotice | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(initialWorkspaceId);
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);
  const [isCopyingInvite, setIsCopyingInvite] = useState(false);

  const activeMembership = memberships.find((m) => m.workspaceId === activeWorkspaceId);
  const isOwner = activeMembership?.role === "OWNER";
  const activeWorkspaceName = activeMembership?.workspaceName || workspaceName;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const setErrorState = (message: string) => {
    setError(message);
    setNotice({ type: "error", message });
  };

  const setSuccessState = (message: string) => {
    setError("");
    setNotice({ type: "success", message });
  };

  const refreshSnapshot = async (period = parseMonthInput(month)) => {
    const res = await fetch(`/api/v1/workspaces/${activeWorkspaceId}/reports/monthly/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(period),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || "Gagal update snapshot report");
    }
    return json.data as { id: string };
  };

  const loadInvites = useCallback(async () => {
    const res = await fetch(`/api/v1/workspaces/${activeWorkspaceId}/invites`, { cache: "no-store" });
    const { json, raw } = await readApiResponse(res);
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || raw || "Gagal mengambil invite");
    }
    setInvites((json.data || []) as WorkspaceInvite[]);
  }, [activeWorkspaceId]);

  const createWorkspaceInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      });
      const { json, raw } = await readApiResponse(res);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || raw || "Gagal membuat invite");
      }
      setInviteUrl(String(json.data.url || ""));
      await loadInvites();
      setSuccessState("Invite link berhasil dibuat");
    } catch (err) {
      setErrorState(err instanceof Error ? err.message : "Gagal membuat invite");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspaceId}/invites/${inviteId}/revoke`, { method: "POST" });
      const { json, raw } = await readApiResponse(res);
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || raw || "Gagal revoke invite");
      await loadInvites();
      setSuccessState("Invite berhasil direvoke");
    } catch (err) {
      setErrorState(err instanceof Error ? err.message : "Gagal revoke invite");
    }
  };

  const copyInviteLink = async (url: string) => {
    if (!url) return;
    setIsCopyingInvite(true);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setSuccessState("Link invite berhasil dicopy");
        return;
      }

      const el = document.createElement("textarea");
      el.value = url;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();

      const copied = document.execCommand("copy");
      document.body.removeChild(el);

      if (!copied) throw new Error("copy failed");
      setSuccessState("Link invite berhasil dicopy");
    } catch {
      // Fallback for non-secure context (e.g. http on mobile): ask user to copy manually.
      setErrorState("Auto copy gagal. Tekan lama link lalu pilih Copy.");
    } finally {
      setIsCopyingInvite(false);
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) return;
    setIsSwitchingWorkspace(true);
    try {
      const res = await fetch(`/api/v1/workspaces/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Gagal ganti workspace");
      setActiveWorkspaceId(workspaceId);
      window.location.reload();
    } catch (err) {
      setErrorState(err instanceof Error ? err.message : "Gagal ganti workspace");
      setIsSwitchingWorkspace(false);
    }
  };

  const { data: expenses = [], isLoading } = useExpenses(activeWorkspaceId, month, category);

  useEffect(() => {
    loadInvites().catch(() => {
      // ignore invite load errors for non-owner users
    });
  }, [loadInvites]);

  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspaceId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Gagal menyimpan data");
      return json.data as Expense;
    },
    onSuccess: async (created) => {
      queryClient.setQueryData<Expense[]>(["expenses", activeWorkspaceId, month, category], (prev = []) => [created, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["expenses", activeWorkspaceId] });
      try {
        await refreshSnapshot(parsePeriodFromDate(created.expenseDate));
      } catch (err) {
        setErrorState(err instanceof Error ? err.message : "Gagal update snapshot report");
        return;
      }
      setSuccessState("Pengeluaran berhasil disimpan");
    },
    onError: (e: Error) => setErrorState(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspaceId}/expenses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Gagal menghapus data");
      return id;
    },
    onSuccess: async (id) => {
      queryClient.setQueryData<Expense[]>(["expenses", activeWorkspaceId, month, category], (prev = []) =>
        prev.filter((e) => e.id !== id),
      );
      queryClient.invalidateQueries({ queryKey: ["expenses", activeWorkspaceId] });
      try {
        await refreshSnapshot();
      } catch (err) {
        setErrorState(err instanceof Error ? err.message : "Gagal update snapshot report");
        return;
      }
      setSuccessState("Pengeluaran berhasil dihapus");
    },
    onError: (e: Error) => setErrorState(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspaceId}/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Gagal update data");
      return json.data as Expense;
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData<Expense[]>(["expenses", activeWorkspaceId, month, category], (prev = []) =>
        prev.map((e) => (e.id === updated.id ? updated : e)),
      );
      queryClient.invalidateQueries({ queryKey: ["expenses", activeWorkspaceId] });
      setEditingId(null);
      setEditForm(null);
      try {
        await Promise.all([
          refreshSnapshot(),
          refreshSnapshot(parsePeriodFromDate(updated.expenseDate)),
        ]);
      } catch (err) {
        setErrorState(err instanceof Error ? err.message : "Gagal update snapshot report");
        return;
      }
      setSuccessState("Pengeluaran berhasil diupdate");
    },
    onError: (e: Error) => setErrorState(e.message),
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Capture a stable form element reference before async work.
    // React synthetic events may be released, making e.currentTarget null later.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    await createMutation.mutateAsync({
      title: form.get("title"),
      amount: Number(form.get("amount")),
      category: form.get("category"),
      paymentMethod: form.get("paymentMethod"),
      expenseDate: String(form.get("expenseDate") || ""),
      note: form.get("note") || null,
    });

    formEl.reset();
  }

  function startEdit(e: Expense) {
    setEditingId(e.id);
    setEditForm({
      title: e.title,
      amount: String(e.amount),
      category: e.category,
      paymentMethod: e.paymentMethod,
      expenseDate: toLocalDateInput(e.expenseDate),
      note: e.note || "",
    });
  }

  async function submitEdit(id: string) {
    if (!editForm) return;
    const amount = Number(editForm.amount);
    if (!editForm.title.trim() || Number.isNaN(amount) || amount <= 0) {
      setError("Data edit belum valid");
      return;
    }

    await editMutation.mutateAsync({
      id,
      payload: {
        title: editForm.title.trim(),
        amount,
        category: editForm.category,
        paymentMethod: editForm.paymentMethod,
        expenseDate: editForm.expenseDate,
        note: editForm.note || null,
      },
    });
  }

  const isCreating = createMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isUpdating = editMutation.isPending;

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Workspace aktif</p>
            <p className="text-sm font-semibold text-slate-800">{activeWorkspaceName}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeWorkspaceId}
              onChange={(e) => switchWorkspace(e.target.value)}
              disabled={isSwitchingWorkspace}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {memberships.map((m) => (
                <option key={m.workspaceId} value={m.workspaceId}>
                  {m.workspaceName} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-[0_12px_32px_rgba(99,102,241,.12)] lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800">Quick Add Expense</h2>
          <form onSubmit={onSubmit} className="mt-4 grid md:grid-cols-2 gap-3">
            <input name="title" placeholder="Judul" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
            <input name="amount" type="number" min="1" step="1" placeholder="Nominal" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
            <select name="category" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5" defaultValue="Food">
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="paymentMethod" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5" defaultValue="CASH">
              {Object.values(PaymentMethod).map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
            <input name="expenseDate" type="date" defaultValue={nowInput()} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
            <input name="note" placeholder="Catatan" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
            <button disabled={isCreating} type="submit" className="md:col-span-2 rounded-2xl bg-slate-900 text-white py-2.5 font-semibold disabled:opacity-60">
              {isCreating ? "Menyimpan..." : "Simpan Pengeluaran"}
            </button>
          </form>
          {notice ? (
            <p className={`mt-3 text-sm ${notice.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
              {notice.message}
            </p>
          ) : error ? (
            <p className="mt-3 text-sm text-rose-600">{error}</p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-[0_12px_32px_rgba(16,185,129,.12)]">
          <p className="text-xs font-semibold text-emerald-700">MONTH SUMMARY</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-800">Rp {total.toLocaleString("id-ID")}</p>
          <p className="text-sm text-slate-500 mt-1">Total bulan ini</p>

          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-slate-600">Undang Kolaborator</p>
            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "EDITOR" | "VIEWER")}
                disabled={!isOwner}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button
                type="button"
                onClick={createWorkspaceInvite}
                disabled={isCreatingInvite || !isOwner}
                className="rounded-xl border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-60"
              >
                {isCreatingInvite ? "Membuat..." : "Generate"}
              </button>
            </div>
          </div>
          {!isOwner ? <p className="mt-2 text-[11px] text-slate-500">Hanya OWNER yang bisa membuat/revoke invite.</p> : null}

          {inviteUrl ? (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="text-[11px] text-slate-500">Link invite terbaru</p>
              <a
                href={inviteUrl}
                target="_blank"
                rel="noreferrer"
                title={inviteUrl}
                className="block w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-indigo-600 underline"
              >
                {inviteUrl}
              </a>
              <button
                type="button"
                onClick={() => copyInviteLink(inviteUrl)}
                disabled={isCopyingInvite}
                className="mt-2 rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-60"
              >
                {isCopyingInvite ? "Copying..." : "Copy Link"}
              </button>
            </div>
          ) : null}

          {invites.length ? (
            <div className="mt-2 space-y-1">
              {invites.slice(0, 3).map((invite) => (
                <div key={invite.id} className="rounded-lg border border-slate-200 px-2 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-slate-600">{invite.role} • {new Date(invite.expiresAt).toLocaleString("id-ID")}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyInviteLink(invite.url)} className="text-[11px] text-indigo-600 disabled:opacity-60" disabled={isCopyingInvite}>Copy</button>
                      <button disabled={!isOwner} onClick={() => revokeInvite(invite.id)} className="text-[11px] text-rose-600 disabled:opacity-60">Revoke</button>
                    </div>
                  </div>
                  <a href={invite.url} target="_blank" rel="noreferrer" title={invite.url} className="mt-1 block w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-slate-500 underline">
                    {invite.url}
                  </a>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800">Expense Feed</h2>
          <div className="flex flex-wrap gap-2">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
              <option value="">Semua kategori</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
          {!isLoading && expenses.length === 0 ? <p className="text-sm text-slate-500">Belum ada data.</p> : null}
          {!isLoading &&
            expenses.map((e) => {
              const isEditing = editingId === e.id && editForm;
              return (
                <div key={e.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  {!isEditing ? (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{e.title}</p>
                        <p className="text-xs text-slate-500">{e.category} • {e.paymentMethod} • {new Date(e.expenseDate).toLocaleDateString("id-ID")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">Rp {Number(e.amount).toLocaleString("id-ID")}</p>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEdit(e)} className="text-xs text-indigo-600">Edit</button>
                          <button disabled={isDeleting} onClick={() => deleteMutation.mutate(e.id)} className="text-xs text-rose-600 disabled:opacity-60">{isDeleting ? "Menghapus..." : "Hapus"}</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-2">
                      <input value={editForm.title} onChange={(ev) => setEditForm({ ...editForm, title: ev.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2" />
                      <input value={editForm.amount} onChange={(ev) => setEditForm({ ...editForm, amount: ev.target.value })} type="number" min="1" className="rounded-xl border border-slate-200 bg-white px-3 py-2" />
                      <select value={editForm.category} onChange={(ev) => setEditForm({ ...editForm, category: ev.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={editForm.paymentMethod} onChange={(ev) => setEditForm({ ...editForm, paymentMethod: ev.target.value as PaymentMethod })} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        {Object.values(PaymentMethod).map((method) => <option key={method} value={method}>{method}</option>)}
                      </select>
                      <input value={editForm.expenseDate} onChange={(ev) => setEditForm({ ...editForm, expenseDate: ev.target.value })} type="date" className="rounded-xl border border-slate-200 bg-white px-3 py-2" />
                      <input value={editForm.note} onChange={(ev) => setEditForm({ ...editForm, note: ev.target.value })} placeholder="Catatan" className="rounded-xl border border-slate-200 bg-white px-3 py-2" />
                      <div className="md:col-span-2 flex items-center gap-2 justify-end">
                        <button onClick={() => { setEditingId(null); setEditForm(null); }} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm">Batal</button>
                        <button disabled={isUpdating} onClick={() => submitEdit(e.id)} className="rounded-xl bg-indigo-600 text-white px-3 py-1.5 text-sm disabled:opacity-60">{isUpdating ? "Menyimpan..." : "Simpan"}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </section>
    </>
  );
}
