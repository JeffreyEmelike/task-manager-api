import z from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(["todo", "in-progress", "review", "done"]).default("todo"),
  assignee: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  workspace: z.string().min(1, "workspaceId is required"),
});

export const updateTaskSchema = createTaskSchema
  .omit({ workspace: true })
  .partial();

export const addCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(2000),
});
