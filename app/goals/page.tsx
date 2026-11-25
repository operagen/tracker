import Link from "next/link";
import { Shell, PageHeader, activityLabel } from "@/components/Shell";
import { listGoalsDetailed } from "@/lib/service";
import { goalColor } from "@/lib/palette";
import { fmtDate, fmtStamp } from "@/lib/time";

export const dynamic = "force-dynamic";
const TABS = ["active", "paused", "done", "dropped", "all"] as const;
type Tab = (typeof TABS)[number];

export default async function Goals({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(status ?? "") ? (status as Tab) : "active";
  const all = await listGoalsDetailed();
  const shown = all.filter((g) => tab === "all" || g.status === tab);
  const activeCount = all.filter((g) => g.status === "active").length;
  const p = (n: number) => String(n).padStart(2, "0");

  return (
    <Shell active="goals">
      <PageHeader eyebrow={`${p(all.length)} GOALS / ${p(activeCount)} ACTIVE`} title="Goals" />
      <nav aria-label="Filter by status" className="flex flex-wrap border-b-[3px] border-black">
        {TABS.map((t) => (
          <Link key={t} href={t === "active" ? "/goals" : `/goals?status=${t}`} aria-current={t === tab ? "page" : undefined}
            className={`flex min-h-13 items-center border-r border-black px-5.5 text-[13px] font-bold uppercase ${t === tab ? "bg-black text-white" : "hover:bg-[#EDEDED]"}`}>
            {t}
          </Link>
        ))}
      </nav>
      {shown.length === 0 && <p className="m-0 px-[clamp(16px,4vw,48px)] py-6 text-sm">No goals here. Ask Claude to add one.</p>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))]">
        {shown.map((g) => (
          <article key={g.id} className="flex flex-col border-r border-b-[3px] border-black">
            <div aria-hidden="true" className="h-3 border-b border-black" style={{ background: goalColor(g.id) }} />
            <div className="flex flex-col gap-3 border-b border-black px-[clamp(16px,3vw,32px)] py-6">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span className="inline-block border-2 border-black px-2 py-1 text-xs font-bold uppercase">{g.status}</span>
                <span className="text-[13px]">TARGET {fmtDate(g.targetDate)}</span>
              </div>
              <h2 className="m-0 text-[26px] leading-[1.1] font-bold tracking-[-0.02em] uppercase">{g.title}</h2>
              {g.description && <p className="m-0 text-sm leading-normal text-[#3A3A3A]">{g.description}</p>}
            </div>
            <div className="px-[clamp(16px,3vw,32px)] pt-3 pb-1 text-xs font-bold">[ ACTIVITIES ]</div>
            {g.activities.length === 0 && <p className="m-0 px-[clamp(16px,3vw,32px)] py-2.5 text-sm">None linked yet.</p>}
            {g.activities.map((a) => (
              <Link key={a.id} href={`/activities/${a.id}`} className="flex justify-between gap-3 px-[clamp(16px,3vw,32px)] py-2.5 text-sm hover:bg-[#EDEDED]">
                <span className={a.status === "skipped" ? "line-through" : ""}>{a.title}</span>
                <span className="text-xs font-bold whitespace-nowrap">{activityLabel(a.status)}</span>
              </Link>
            ))}
            {g.updates.length > 0 && (
              <>
                <div className="mt-2 border-t border-black px-[clamp(16px,3vw,32px)] pt-4 pb-1 text-xs font-bold">[ RECENT ]</div>
                {g.updates.map((u) => (
                  <p key={u.id} className="m-0 px-[clamp(16px,3vw,32px)] py-2 text-[13px] leading-normal">
                    <span className="font-bold">{fmtStamp(u.createdAt)}</span> {u.note}
                  </p>
                ))}
              </>
            )}
            <div className="h-4" />
          </article>
        ))}
      </div>
    </Shell>
  );
}
