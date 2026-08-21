import { Schema, models, model, Types } from "mongoose";

export interface IComment {
  post: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
}

const CommentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 1000, trim: true },
  },
  { timestamps: true }
);

export default models.Comment || model<IComment>("Comment", CommentSchema);
