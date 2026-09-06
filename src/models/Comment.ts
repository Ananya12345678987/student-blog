import { Schema, models, model, Types } from "mongoose";

export interface IComment {
  post: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  parentComment?: Types.ObjectId;
}

const CommentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 1000, trim: true },
    // Undefined = a top-level comment. Set = a reply to another comment.
    // Only one level deep (a reply to a reply still points at the same
    // top-level parent) — kept simple deliberately, since deeply nested
    // threads are more complexity than a student blog's comments need.
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment" },
  },
  { timestamps: true }
);

export default models.Comment || model<IComment>("Comment", CommentSchema);
