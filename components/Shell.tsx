import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

const nav = [
  { href: "/", label: "Today", key: "today" },
  { href: "/goals", label: "Goals", key: "goals" },
];

export function Shell({ active, children }: { active?: "today" | "goals"; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <nav aria-label="Main" className="flex max-w-60 min-w-50 flex-[1_1_200px] flex-col border-r-[3px] border-black max-md:max-w-none max-md:flex-[1_1_100%] max-md:flex-row max-md:border-r-0 max-md:border-b-[3px]">
        <div className="border-b-[3px] border-black px-5 py-6 text-xl font-bold uppercase max-md:border-r-[3px] max-md:border-b-0 max-md:py-0 max-md:flex max-md:items-center">Tracker</div>
        {nav.map((n) => {
          const on = n.key === active;
          return (
            <Link key={n.key} href={n.href} aria-current={on ? "page" : undefined}
              className={`flex min-h-14 items-center border-b border-black px-5 uppercase max-md:border-b-0 max-md:border-r ${on ? "bg-black font-bold text-white" : "font-medium hover:bg-[#EDEDED]"}`}>
              {on ? "→ " : ""}{n.label}
            </Link>
          );
        })}
        <form action={signOut} className="mt-auto max-md:ml-auto">
          <button className="flex min-h-14 w-full cursor-pointer items-center border-t border-black px-5 text-[13px] uppercase hover:bg-[#EDEDED] max-md:border-t-0">Sign out</button>
        </form>
      </nav>
      <main className="flex min-w-0 flex-[999_1_560px] flex-col">{children}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-black px-[clamp(16px,4vw,48px)] py-8">
      <div>
        <p className="m-0 mb-2 text-sm">{eyebrow}</p>
        <h1 className="m-0 text-[clamp(48px,7vw,88px)] leading-[0.9] font-bold tracking-[-0.04em] uppercase">{title}</h1>
      </div>
      {right}
    </header>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  planned: { label: "PLANNED", cls: "bg-white text-black" },
  in_progress: { label: "● ACTIVE", cls: "bg-white text-black" },
  done: { label: "DONE", cls: "bg-black text-white" },
  skipped: { label: "SKIPPED", cls: "bg-white text-[#5A5A5A]" },
};
export function ActivityBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.planned;
  return <span className={`inline-block border-2 border-black px-2 py-1 text-xs font-bold whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}
export const activityLabel = (status: string) => (STATUS[status] ?? STATUS.planned).label;
