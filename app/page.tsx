import Link from "next/link";

function ClayCard({
  title,
  desc,
  badge,
}: {
  title: string;
  desc: string;
  badge: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_16px_35px_rgba(79,70,229,.13),inset_0_2px_0_rgba(255,255,255,.9)]">
      <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
        {badge}
      </span>
      <h3 className="mt-3 text-lg font-extrabold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-gradient-to-br from-fuchsia-200 via-sky-100 to-emerald-100 p-7 md:p-10 shadow-[0_24px_60px_rgba(30,41,59,.13)]">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-yellow-200/70 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-pink-200/70 blur-2xl" />

        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-700">EXPENSE DOCS</p>
            <h1 className="mt-2 text-3xl md:text-5xl font-black leading-tight text-slate-800">
              Playful Finance
              <br />
              Learning Platform
            </h1>
            <p className="mt-3 text-slate-700 text-sm md:text-base">
              Claymorphism UI + progress tracking + smart insights. Tetap fokus: catat pengeluaran harian
              secepat mungkin.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow">
                Course Catalog Preview
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow">
                Progress Demo
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-fuchsia-700 shadow">
                Testimonials
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow"
              >
                Login
              </Link>
              <Link className="rounded-2xl border border-white/80 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700" href="/register">
                Register
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-white/90 p-4 border border-white shadow-[0_12px_28px_rgba(0,0,0,.09)]">
              <p className="text-xs text-slate-500">Progress</p>
              <p className="mt-1 text-3xl font-black text-indigo-700">82%</p>
              <p className="text-xs text-slate-500">Budget consistency</p>
            </div>
            <div className="rounded-[24px] bg-white/90 p-4 border border-white shadow-[0_12px_28px_rgba(0,0,0,.09)]">
              <p className="text-xs text-slate-500">Courses</p>
              <p className="mt-1 text-3xl font-black text-fuchsia-700">12</p>
              <p className="text-xs text-slate-500">Finance modules</p>
            </div>
            <div className="col-span-2 rounded-[24px] bg-white/90 p-4 border border-white shadow-[0_12px_28px_rgba(0,0,0,.09)]">
              <p className="text-xs text-slate-500">Student testimonial</p>
              <p className="mt-1 text-sm text-slate-700">
                “Akhirnya catatan keuangan jadi fun dan konsisten. UI-nya bikin pengen update tiap hari.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <ClayCard
          badge="Catalog"
          title="Expense Course Catalog"
          desc="Food, transport, groceries, bills — semua kategori dipelajari dan dilacak rapi."
        />
        <ClayCard
          badge="Tracking"
          title="Progress Tracking Demo"
          desc="Lihat total bulanan, kebiasaan belanja, dan konsistensi finansial secara visual."
        />
        <ClayCard
          badge="Enrollment"
          title="Enrollment CTA"
          desc="Gabung workspace, invite member, dan audit bulanan AI untuk growth bareng."
        />
      </section>
    </main>
  );
}
