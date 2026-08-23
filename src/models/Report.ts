import { Schema, models, model, Types } from "mongoose";
import "@/models/User";

export interface IReport {
  reporter: Types.ObjectId;
  targetType: "POST" | "COMMENT";
  targetId: Types.ObjectId;
  reason: string;
  status: "PENDING" | "RESOLVED";
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["POST", "COMMENT"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["PENDING", "RESOLVED"], default: "PENDING", index: true },
  },
  { timestamps: true }
);

export default models.Report || model<IReport>("Report", ReportSchema);