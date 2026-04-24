import ActivityLog from "../models/ActivityLog";
import { Types } from "mongoose";

interface LogParams {
  workspace: Types.ObjectId | string;
  actor: Types.ObjectId | string;
  entity: "task" | "project" | "workspace" | "user";
  entityId: Types.ObjectId | string;
  action: "created" | "updated" | "deleted" | "assigned";
  diff?: Record<string, unknown>;
}

export const logActivity = async (params: LogParams): Promise<void> => {
  await ActivityLog.create(params);
};
