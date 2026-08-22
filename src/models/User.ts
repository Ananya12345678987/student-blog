import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarSeed: string;
  avatarStyle: string;
  bio?: string;
  college?: string;
  role: "STUDENT" | "ADMIN";
  createdAt: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/, // prevents weird usernames being used in URLs (/@username)
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // NEVER store plaintext passwords. This field holds a bcrypt hash only.
    // The field name makes that explicit so nobody accidentally logs/returns
    // this thinking it's the plaintext password.
    passwordHash: { type: String, required: true, select: false },
    avatarSeed: {
    type: String,
    required: true,
    },
    avatarStyle: {
  type: String,
  default: "identicon",
  enum: [
    "identicon",
    "adventurer",
    "bottts",
    "fun-emoji",
    "lorelei",
    "notionists",
  ],
},
  
    bio: { type: String, maxlength: 300, default: "" },
    college: { type: String, maxlength: 120, default: "" },
    role: { type: String, enum: ["STUDENT", "ADMIN"], default: "STUDENT" },
    // Hashed reset token + expiry for the forgot-password flow. Never
    // store the raw token — only its hash, same principle as passwordHash.
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

// select: false above means passwordHash is excluded from normal queries
// by default — you have to explicitly .select('+passwordHash') to get it,
// which only the login code path does. This prevents accidentally leaking
// the hash in an API response for e.g. GET /api/users/:username.

export default models.User || model<IUser>("User", UserSchema);