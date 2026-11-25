import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  goalActivities,
  goals,
  progressUpdates,
  goalStatuses,
  activityStatuses,
} from "@/db/schema";
import { today } from "./time";

type GoalStatus = (typeof goalStatuses)[number];
type ActivityStatus = (typeof activityStatuses)[number];

// ---------- reads ----------

export async function listGoals(opts: { status?: GoalStatus } = {}) {
  return db
    .select()
    .from(goals)
    .where(opts.status ? eq(goals.status, opts.status) : undefined)
    .orderBy(goals.createdAt);
}

async function activitiesForGoals(goalIds: string[]) {
  if (!goalIds.length) return [];
  return db
    .select({
      goalId: goalActivities.goalId,
      id: activities.id,
      title: activities.title,
      status: activities.status,
      scheduledDate: activities.scheduledDate,
    })
    .from(goalActivities)
    .innerJoin(activities, eq(activities.id, goalActivities.activityId))
    .where(inArray(goalActivities.goalId, goalIds))
    .orderBy(desc(activities.updatedAt));
}

async function updatesForActivities(activityIds: string[], limit?: number) {
  if (!activityIds.length) return [];
  const q = db
    .select()
    .from(progressUpdates)
    .where(inArray(progressUpdates.activityId, activityIds))
    .orderBy(desc(progressUpdates.createdAt));
  return limit ? q.limit(limit) : q;
}

/** Goals with their linked activities and recent updates (for the Goals screen). */
export async function listGoalsDetailed(opts: { status?: GoalStatus } = {}) {
  const gs = await listGoals(opts);
  const acts = await activitiesForGoals(gs.map((g) => g.id));
  const ups = await updatesForActivities(acts.map((a) => a.id));
  return gs.map((g) => {
    const gActs = acts.filter((a) => a.goalId === g.id);
    const ids = new Set(gActs.map((a) => a.id));
    return {
      ...g,
      activities: gActs,
      updates: ups.filter((u) => ids.has(u.activityId)).slice(0, 3),
    };
  });
}

export async function getGoal(id: string) {
  const [g] = await db.select().from(goals).where(eq(goals.id, id));
  if (!g) return null;
  const acts = await activitiesForGoals([id]);
  const ups = await updatesForActivities(acts.map((a) => a.id));
  return { ...g, activities: acts, updates: ups };
}

export async function listActivities(
  f: { status?: ActivityStatus; date?: string; goalId?: string; from?: string; to?: string } = {},
) {
  const conds = [
    f.status && eq(activities.status, f.status),
    f.date && eq(activities.scheduledDate, f.date),
    f.from && sql`${activities.scheduledDate} >= ${f.from}`,
    f.to && sql`${activities.scheduledDate} <= ${f.to}`,
    f.goalId &&
      sql`${activities.id} in (select activity_id from goal_activities where goal_id = ${f.goalId})`,
  ].filter(Boolean) as ReturnType<typeof eq>[];
  return db
    .select()
    .from(activities)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(activities.scheduledDate, activities.createdAt);
}

export async function getActivity(id: string) {
  const [a] = await db.select().from(activities).where(eq(activities.id, id));
  if (!a) return null;
  const linked = await db
    .select({ id: goals.id, title: goals.title, status: goals.status })
    .from(goalActivities)
    .innerJoin(goals, eq(goals.id, goalActivities.goalId))
    .where(eq(goalActivities.activityId, id));
  const ups = await updatesForActivities([id]);
  return { ...a, goals: linked, updates: ups };
}

/** Everything scheduled on a date, each with goals and latest progress. */
export async function getDay(date: string = today()) {
  const acts = await listActivities({ date });
  const ids = acts.map((a) => a.id);
  const links = ids.length
    ? await db
        .select({ activityId: goalActivities.activityId, id: goals.id, title: goals.title })
        .from(goalActivities)
        .innerJoin(goals, eq(goals.id, goalActivities.goalId))
        .where(inArray(goalActivities.activityId, ids))
    : [];
  const ups = await updatesForActivities(ids);
  const items = acts.map((a) => {
    const mine = ups.filter((u) => u.activityId === a.id);
    return {
      ...a,
      goals: links.filter((l) => l.activityId === a.id).map(({ id, title }) => ({ id, title })),
      latest: mine[0] ?? null,
      minutes: mine.reduce((s, u) => s + (u.minutes ?? 0), 0),
    };
  });
  return { date, activities: items };
}

// ---------- writes ----------

export async function createGoal(input: {
  title: string;
  description?: string;
  status?: GoalStatus;
  targetDate?: string;
}) {
  const [g] = await db.insert(goals).values(input).returning();
  return g;
}

export async function updateGoal(
  id: string,
  patch: { title?: string; description?: string | null; status?: GoalStatus; targetDate?: string | null },
) {
  const [g] = await db
    .update(goals)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(goals.id, id))
    .returning();
  return g ?? null;
}

export async function createActivity(input: {
  title: string;
  description?: string;
  scheduledDate?: string;
  status?: ActivityStatus;
  goalIds?: string[];
}) {
  const { goalIds = [], ...values } = input;
  return db.transaction(async (tx) => {
    const [a] = await tx.insert(activities).values(values).returning();
    if (goalIds.length) {
      await tx
        .insert(goalActivities)
        .values(goalIds.map((goalId) => ({ goalId, activityId: a.id })))
        .onConflictDoNothing();
    }
    return a;
  });
}

export async function updateActivity(
  id: string,
  patch: {
    title?: string;
    description?: string | null;
    scheduledDate?: string | null;
    status?: ActivityStatus;
  },
) {
  const [a] = await db
    .update(activities)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(activities.id, id))
    .returning();
  return a ?? null;
}

export async function linkActivity(activityId: string, goalId: string) {
  await db.insert(goalActivities).values({ goalId, activityId }).onConflictDoNothing();
  return { activityId, goalId, linked: true };
}

export async function unlinkActivity(activityId: string, goalId: string) {
  await db
    .delete(goalActivities)
    .where(and(eq(goalActivities.goalId, goalId), eq(goalActivities.activityId, activityId)));
  return { activityId, goalId, linked: false };
}

export async function addProgress(activityId: string, note: string, minutes?: number) {
  const [u] = await db.insert(progressUpdates).values({ activityId, note, minutes }).returning();
  await db.update(activities).set({ updatedAt: new Date() }).where(eq(activities.id, activityId));
  return u;
}
