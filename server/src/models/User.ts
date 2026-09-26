import { Schema, model } from "mongoose";

export type Role = "admin" | "user";

export interface IUser {
  email: string;
  password: string; // bcrypt hash — never the plain password
  firstName: string;
  lastName: string;
  role: Role;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
