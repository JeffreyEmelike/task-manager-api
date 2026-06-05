import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "guest"]).default("member"),
});
