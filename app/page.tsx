import Link from "next/link";
import { Shell, PageHeader, ActivityBadge } from "@/components/Shell";
import { getDay } from "@/lib/service";
import { goalColor } from "@/lib/palette";
import { fmtLongDate, fmtTime, today } from "@/lib/time";

export const dynamic = "force-dynamic";
const pad = (n: number) => String(n).padStart(2, "0");

export default async function Today() {
  const date = today();
  const { activities } = await getDay(date);
  const done = activities.filter((a) => a.status === "done").length;
  const active = activities.filter((a) => a.status === "in_progress").length;

  const touched = new Map<string, { id: string; title: string; count: number; last: Date | null }>();
  for (const a of activities)
    for (const g of a.goals) {
      const t = touched.get(g.id) ?? { ...g, count: 0, last: null };
      t.count++;
      if (a.latest && (!t.last || a.latest.createdAt > t.last)) t.last = a.latest.createdAt;
      touched.set(g.id, t);
    }

  return (
    <Shell active="today">
      <PageHeader
        eyebrow={fmtLongDate(date)}
        title="Today"
        right={<p className="m-0 text-sm">{pad(activities.length)} ITEMS / {pad(done)} DONE / {pad(active)} ACTIVE</p>}
      />
      <div className="flex flex-1 flex-wrap items-stretch">
        <section aria-labelledby="sched" className="flex min-w-0 flex-[999_1_480px] flex-col">
          <h2 id="sched" className="m-0 border-b border-black px-[clamp(16px,4vw,48px)] py-3.5 text-[13px] font-bold uppercase">[ Scheduled ]</h2>
          {activities.length === 0 && (
            <p className="m-0 px-[clamp(16px,4vw,48px)] py-6 text-sm">Nothing scheduled. Tell Claude what you plan to do today.</p>
          )}
          {activities.map((a, i) => (
            <Link key={a.id} href={`/activities/${a.id}`} className="grid grid-cols-[8px_40px_minmax(0,1fr)_auto] items-stretch gap-4 border-b border-black pr-[clamp(16px,4vw,48px)] hover:bg-[#EDEDED]">
              <span aria-hidden="true" style={{ background: a.goals[0] ? goalColor(a.goals[0].id) : "#fff" }} />
              <span className="py-4.5 text-sm font-bold">{pad(i + 1)}</span>
              <div className="flex min-w-0 flex-col gap-2 py-4.5">
                <span className={`text-lg font-bold ${a.status === "skipped" ? "text-[#5A5A5A] line-through" : ""}`}>{a.title}</span>
                <div className="flex flex-wrap gap-3.5">
                  {a.goals.map((g) => (
                    <span key={g.id} className="inline-flex items-center gap-2 text-[13px] uppercase">
                      <span aria-hidden="true" className="size-3 border-2 border-black" style={{ background: goalColor(g.id) }} />
                      {g.title}
                    </span>
                  ))}
                </div>
                {a.latest && (
                  <span className="text-sm leading-normal text-[#3A3A3A]">{fmtTime(a.latest.createdAt)} — {a.latest.note}</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 py-4.5">
                <ActivityBadge status={a.status} />
                <span className="text-[13px]">{a.minutes ? `${pad(a.minutes)} MIN` : "—"}</span>
              </div>
            </Link>
          ))}
        </section>

        <aside aria-labelledby="gt" className="flex min-w-0 flex-[1_1_260px] flex-col border-l-[3px] border-black max-md:border-t-[3px] max-md:border-l-0">
          <h2 id="gt" className="m-0 border-b border-black px-5 py-3.5 text-[13px] font-bold uppercase">[ Goals touched ]</h2>
          {[...touched.values()].map((g) => (
            <Link key={g.id} href="/goals" className="flex items-start gap-3.5 border-b border-black px-5 py-4 hover:bg-[#EDEDED]">
              <span aria-hidden="true" className="mt-0.5 size-4 shrink-0 border-2 border-black" style={{ background: goalColor(g.id) }} />
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-bold uppercase">{g.title}</span>
                <span className="text-[13px]">{pad(g.count)} {g.count === 1 ? "ITEM" : "ITEMS"}{g.last ? ` · ${fmtTime(g.last)}` : ""}</span>
              </span>
            </Link>
          ))}
          <p className="m-0 px-5 py-4 text-[13px] leading-normal">Tell Claude what you did. It logs it here.</p>
        </aside>
      </div>
    </Shell>
  );
}
