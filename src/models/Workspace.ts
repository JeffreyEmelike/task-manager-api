import mongoose, { Document, Schema, Types } from "mongoose";

// Interfaace for an individual member entry inside the workspace
interface IWorkspaceMember {
  user: Types.ObjectId;
  role: "admin" | "member" | "guest";
}

export interface IWorkspace extends Document {
  name: string;
  owner: Types.ObjectId;
  members: IWorkspaceMember[];
  inviteTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IWorkspaceMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["admin", "member", "guest"],
      default: "member",
    },
  },
  { _id: false },
);

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, rewuired: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [MemberSchema],
    inviteTokens: [{ type: String }],
  },
  { timestamps: true },
);

WorkspaceSchema.index;
({ owner: 1 });

export default mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);
