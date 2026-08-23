import { z } from "zod";

/**
 * Every one of these schemas MUST be re-run on the server, even though the
 * frontend forms will also validate. Client-side validation is only a UX
 * nicety — it runs in the user's browser, which is fully under their
 * control. Someone can bypass your React form entirely and POST directly
 * to /api/posts with curl/Postman, so the server is the only place
 * validation actually enforces anything.
 */

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  email: z.string().trim().toLowerCase().email(),
  // Length + basic complexity check here. The actual hashing (bcrypt) happens
  // in the register route, never in this validation layer.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long") // bcrypt silently truncates beyond 72 bytes
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const postCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().max(300).optional(),
  content: z.string().trim().min(10),
  coverImage: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const postUpdateSchema = postCreateSchema.partial();

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

  export const reportCreateSchema = z.object({
  targetType: z.enum(["POST", "COMMENT"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3).max(500),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
