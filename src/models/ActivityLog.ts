import mongoose, { Document, Schema, Types } from "mongoose";
export interface IActivityLog extends Document {
  workspace: Types.ObjectId;
  actor: Types.ObjectId; // who did it
  entity: "task" | "project" | "workspace" | "user";
  entityId: Types.ObjectId;
  action: "created" | "updated" | "deleted" | "assigned";
  diff?: Record<string, unknown>; // what changed
  timestamp: Date;
}
const LogSchema = new Schema<IActivityLog>({
  workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  entity: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  diff: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

// Immutable - never update or delete logs
LogSchema.index({ workspace: 1, timestamp: -1 });

export default mongoose.model<IActivityLog>("ActivityLog", LogSchema);
