import {
  pgSchema,
  uuid,
  text,
  date,
  integer,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

// Own Postgres schema: this database is shared with another app.
export const tracker = pgSchema("tracker");

export const goalStatuses = ["active", "paused", "done", "dropped"] as const;
export const activityStatuses = ["planned", "in_progress", "done", "skipped"] as const;

export const goals = tracker.table("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: goalStatuses }).notNull().default("active"),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = tracker.table("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: date("scheduled_date"),
  status: text("status", { enum: activityStatuses }).notNull().default("planned"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const goalActivities = tracker.table(
  "goal_activities",
  {
    goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.goalId, t.activityId] })],
);

export const progressUpdates = tracker.table("progress_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  minutes: integer("minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Goal = typeof goals.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ProgressUpdate = typeof progressUpdates.$inferSelect;
