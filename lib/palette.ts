export const GOAL_COLORS = ["#2F5BFF", "#00C853", "#FFC400", "#C04BFF", "#FF5A1F", "#00B8D9"];

/** Stable colour per goal, derived from its id. */
export function goalColor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GOAL_COLORS[h % GOAL_COLORS.length];
}
