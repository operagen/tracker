import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell, ActivityBadge } from "@/components/Shell";
import { getActivity } from "@/lib/service";
import { goalColor } from "@/lib/palette";
import { fmtDate, fmtStamp } from "@/lib/time";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ActivityPage({ params }: PageProps<"/activities/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const a = await getActivity(id);
  if (!a) notFound();
  const total = a.updates.reduce((s, u) => s + (u.minutes ?? 0), 0);

  return (
    <Shell>
      <Link href="/" className="flex min-h-12 items-center border-b border-black px-[clamp(16px,4vw,48px)] text-[13px] uppercase hover:bg-[#EDEDED]">← Back to today</Link>
      <header className="flex border-b-[3px] border-black">
        <div aria-hidden="true" className="w-4 shrink-0 border-r border-black" style={{ background: a.goals[0] ? goalColor(a.goals[0].id) : "#fff" }} />
        <div className="flex min-w-0 flex-1 flex-col gap-3.5 px-[clamp(16px,4vw,48px)] py-7">
          <p className="m-0 text-sm">ACTIVITY / {a.scheduledDate ? `SCHEDULED ${fmtDate(a.scheduledDate)}` : "UNSCHEDULED"}</p>
          <h1 className="m-0 text-[clamp(36px,5vw,64px)] leading-[0.95] font-bold tracking-[-0.03em] uppercase">{a.title}</h1>
          {a.description && <p className="m-0 max-w-[64ch] text-[15px] leading-normal text-[#3A3A3A]">{a.description}</p>}
        </div>
      </header>
      <div className="flex flex-wrap border-b-[3px] border-black">
        <div className="flex flex-[1_1_260px] flex-col gap-2.5 border-r border-black px-[clamp(16px,4vw,48px)] py-4.5 max-md:border-r-0 max-md:border-b">
          <span className="text-xs font-bold">[ STATUS ]</span>
          <div><ActivityBadge status={a.status} /></div>
        </div>
        <div className="flex flex-[1_1_260px] flex-col gap-2.5 px-[clamp(16px,4vw,48px)] py-4.5">
          <span className="text-xs font-bold">[ GOALS ]</span>
          <div className="flex flex-wrap items-center gap-2.5">
            {a.goals.length === 0 && <span className="text-[13px]">None linked.</span>}
            {a.goals.map((g) => (
              <Link key={g.id} href="/goals" className="inline-flex min-h-11 items-center gap-2 border-2 border-black px-3 text-[13px] font-bold uppercase hover:bg-[#EDEDED]">
                <span aria-hidden="true" className="size-3 border-2 border-black" style={{ background: goalColor(g.id) }} />{g.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <section aria-labelledby="tl" className="flex min-w-0 flex-1 flex-col">
        <h2 id="tl" className="m-0 border-b border-black px-[clamp(16px,4vw,48px)] py-3.5 text-[13px] font-bold uppercase">
          [ Progress ] — {a.updates.length} {a.updates.length === 1 ? "update" : "updates"} / {total} min
        </h2>
        {a.updates.length === 0 && <p className="m-0 px-[clamp(16px,4vw,48px)] py-6 text-sm">No updates yet. Tell Claude what happened.</p>}
        <ol className="m-0 list-none p-0">
          {a.updates.map((u) => (
            <li key={u.id} className="grid grid-cols-[120px_minmax(0,1fr)_auto] gap-4 border-b border-black px-[clamp(16px,4vw,48px)] py-4.5 max-sm:grid-cols-1 max-sm:gap-1">
              <span className="text-[13px] font-bold">{fmtStamp(u.createdAt)}</span>
              <span className="text-[15px] leading-normal">{u.note}</span>
              <span className="text-[13px] whitespace-nowrap">{u.minutes ? `${u.minutes} MIN` : ""}</span>
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
