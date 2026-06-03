import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["active", "archived", "completed"]).default("active"),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
