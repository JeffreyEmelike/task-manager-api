import mongoose, { Document, Schema, Types } from "mongoose";

// Sub-document interface for substacks

interface ISubtask {
  title: string;
  done: boolean;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  project: Types.ObjectId;
  assignee?: Types.ObjectId;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in-progress" | "review" | "done";

  subtasks: ISubtask[];
  attachments: string[]; // array of URLs
  dueDate?: Date;
  embeddings?: number[]; // vector for AI search
  aiTags?: string[];

  createdAt: Date;
  updatedAt: Date;
}

// Sub-document schema
const SubtaskSchema = new Schema<ISubtask>(
  {
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false },
); // no auto-id on sub-documents

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "done"],
      default: "todo",
    },
    subtasks: [SubtaskSchema],
    attachments: [{ type: String }],
    dueDate: { type: Date },
    embeddings: [{ type: Number }],
    aiTags: [{ type: String }],
  },
  { timestamps: true },
);

// Index for fast project-scoped queries
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignee: 1 });

export default mongoose.model<ITask>("Task", TaskSchema);
