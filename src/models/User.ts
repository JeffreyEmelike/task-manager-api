import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

//1. TypeScript interface- gives you autocomplete everywhere
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "member" | "guest";
  workspaces: Types.ObjectId[];
  refreshTokens: string[];
  createdAt: Date;

  //Instance method - we'll add this to the schema
  comparePassword(candidate: string): Promise<boolean>;
}

//2. Mongoose Schema - validates and saves to MongoDB
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "member", "guest"],
      default: "member",
    },
    workspaces: [{ type: Schema.Types.ObjectId, ref: "Workspace" }],
    refreshTokens: [{ type: String }],
  },
  { timestamps: true },
);

//3 Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

//4. Instance method - compare plainText with hashed
UserSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export default mongoose.model<IUser>("User", UserSchema);
