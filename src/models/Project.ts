import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProject extends Document {
  title: string;
  description?: string;
  workspace: Types.ObjectId;

  owner: Types.ObjectId;
  status: "active" | "archived" | "completed";
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    workspace: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["active", "archived", "completed"],
      default: "active",
    },
    tags: [{ type: String }],
    dueDate: { type: Date },
  },
  { timestamps: true },
);

ProjectSchema.index({ workspace: 1, status: 1 });

export default mongoose.model<IProject>("Project", ProjectSchema);
