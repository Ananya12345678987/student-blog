import { Schema, models, model, Types } from "mongoose";
import "@/models/User";
import "@/models/Post";

export interface INotification {
  recipient: Types.ObjectId; // the post owner receiving this notification
  actor: Types.ObjectId; // the user who liked/commented/bookmarked
  type: "LIKE" | "COMMENT" | "BOOKMARK"| "FOLLOW";
  post: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["LIKE", "COMMENT", "BOOKMARK", "FOLLOW"], required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Notifications page always queries "this user's notifications, newest
// first" — this compound index makes that fast.
NotificationSchema.index({ recipient: 1, createdAt: -1 });

export default models.Notification || model<INotification>("Notification", NotificationSchema);