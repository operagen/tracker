import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as svc from "./service";
import { today } from "./time";
import { activityStatuses, goalStatuses } from "@/db/schema";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
const id = z.string().uuid();
const goalStatus = z.enum(goalStatuses);
const activityStatus = z.enum(activityStatuses);

const out = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data ?? null, null, 2) }],
});
const notFound = (what: string) => ({
  isError: true,
  content: [{ type: "text" as const, text: `${what} not found` }],
});

export function buildServer() {
  const s = new McpServer({ name: "tracker", version: "0.1.0" });

  s.registerTool(
    "list_goals",
    { description: "List goals, optionally filtered by status.", inputSchema: { status: goalStatus.optional() } },
    async ({ status }) => out(await svc.listGoals({ status })),
  );

  s.registerTool(
    "get_goal",
    { description: "One goal with its linked activities and all progress updates.", inputSchema: { id } },
    async ({ id }) => {
      const g = await svc.getGoal(id);
      return g ? out(g) : notFound("Goal");
    },
  );

  s.registerTool(
    "list_activities",
    {
      description: "List activities. Filters: status, date (scheduled day), goal_id, from/to (scheduled range).",
      inputSchema: {
        status: activityStatus.optional(),
        date: date.optional(),
        goal_id: id.optional(),
        from: date.optional(),
        to: date.optional(),
      },
    },
    async ({ goal_id, ...rest }) => out(await svc.listActivities({ ...rest, goalId: goal_id })),
  );

  s.registerTool(
    "get_day",
    {
      description: `Activities scheduled on a day with goals and latest progress. Defaults to today (${today()}, Asia/Kolkata).`,
      inputSchema: { date: date.optional() },
    },
    async ({ date }) => out(await svc.getDay(date)),
  );

  s.registerTool(
    "create_goal",
    {
      description: "Create a goal.",
      inputSchema: {
        title: z.string().min(1),
        description: z.string().optional(),
        status: goalStatus.optional(),
        target_date: date.optional(),
      },
    },
    async ({ target_date, ...rest }) => out(await svc.createGoal({ ...rest, targetDate: target_date })),
  );

  s.registerTool(
    "update_goal",
    {
      description: "Update a goal. Pass null to clear description or target_date.",
      inputSchema: {
        id,
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        status: goalStatus.optional(),
        target_date: date.nullable().optional(),
      },
    },
    async ({ id, target_date, ...rest }) => {
      const g = await svc.updateGoal(id, { ...rest, ...(target_date !== undefined && { targetDate: target_date }) });
      return g ? out(g) : notFound("Goal");
    },
  );

  s.registerTool(
    "create_activity",
    {
      description: "Create an activity and link it to goals. scheduled_date defaults to nothing (unscheduled).",
      inputSchema: {
        title: z.string().min(1),
        description: z.string().optional(),
        scheduled_date: date.optional(),
        status: activityStatus.optional(),
        goal_ids: z.array(id).optional(),
      },
    },
    async ({ scheduled_date, goal_ids, ...rest }) =>
      out(await svc.createActivity({ ...rest, scheduledDate: scheduled_date, goalIds: goal_ids })),
  );

  s.registerTool(
    "update_activity",
    {
      description: "Update an activity. Pass null to clear description or scheduled_date.",
      inputSchema: {
        id,
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        scheduled_date: date.nullable().optional(),
        status: activityStatus.optional(),
      },
    },
    async ({ id, scheduled_date, ...rest }) => {
      const a = await svc.updateActivity(id, {
        ...rest,
        ...(scheduled_date !== undefined && { scheduledDate: scheduled_date }),
      });
      return a ? out(a) : notFound("Activity");
    },
  );

  s.registerTool(
    "link_activity",
    { description: "Link an activity to a goal.", inputSchema: { activity_id: id, goal_id: id } },
    async ({ activity_id, goal_id }) => out(await svc.linkActivity(activity_id, goal_id)),
  );

  s.registerTool(
    "unlink_activity",
    { description: "Remove the link between an activity and a goal.", inputSchema: { activity_id: id, goal_id: id } },
    async ({ activity_id, goal_id }) => out(await svc.unlinkActivity(activity_id, goal_id)),
  );

  s.registerTool(
    "add_progress",
    {
      description: "Add a small dated progress note to an activity, optionally with minutes spent.",
      inputSchema: { activity_id: id, note: z.string().min(1), minutes: z.number().int().min(0).optional() },
    },
    async ({ activity_id, note, minutes }) => out(await svc.addProgress(activity_id, note, minutes)),
  );

  return s;
}
