import mongoose, { Document, Schema, Types } from "mongoose";

// Sub-document interface for substacks

interface ISubtask {
  title: string;
  done: boolean;
}

interface IComment {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  createdAt: Date;
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
  embedding: number[]; // vector for AI search
  aiTags?: string[];

  createdAt: Date;
  updatedAt: Date;

  comments: IComment[];
}

// Sub-document schema
const SubtaskSchema = new Schema<ISubtask>(
  {
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false },
); // no auto-id on sub-documents

const CommentSchema = new Schema<IComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

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
    embedding: [{ type: Number }],
    aiTags: [{ type: String }],

    comments: [CommentSchema],
  },
  { timestamps: true },
);

// Index for fast project-scoped queries
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignee: 1 });

export default mongoose.model<ITask>("Task", TaskSchema);
