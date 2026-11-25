const TZ = "Asia/Kolkata";

/** Today's date (YYYY-MM-DD) in Asia/Kolkata. */
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

/** "25.11.2026" from "2026-11-25". */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short" });

export function fmtLongDate(d: string): string {
  const dt = new Date(`${d}T12:00:00+05:30`);
  return `${dayFmt.format(dt).toUpperCase()} ${fmtDate(d)}`;
}

/** "25.11 11:40" in Asia/Kolkata. */
export function fmtStamp(ts: Date): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(ts);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g("day")}.${g("month")} ${g("hour")}:${g("minute")}`;
}

export function fmtTime(ts: Date): string {
  return fmtStamp(ts).split(" ")[1];
}
