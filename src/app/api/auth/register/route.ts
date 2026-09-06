import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validation";
import { resend } from "@/lib/resend";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      // Return validation errors, but never leak internals like stack
      // traces or DB error messages to the client.
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, username, email, password } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      // Deliberately vague — we don't say *which* field collided, so this
      // endpoint can't be used to enumerate whether a specific email is
      // already registered on the platform (a privacy/security detail
      // that's easy to overlook).
      return NextResponse.json(
        { error: "An account with this email or username already exists" },
        { status: 409 }
      );
    }

    // bcrypt with cost factor 12: strong enough to resist brute-forcing an
    // individual hash, cheap enough not to make login noticeably slow.
    // (Argon2id is technically stronger, but bcrypt via bcryptjs needs no
    // native build step, which matters a lot for a fast, free, portable
    // deploy — a reasonable trade-off for this project's scale.)
        const passwordHash = await bcrypt.hash(password, 12);
    const avatarSeed = crypto.randomBytes(16).toString("hex");

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

   const user = await User.create({
   name,
   username,
   email,
   passwordHash,
   avatarSeed,
   avatarStyle: "identicon",
   verificationToken: hashedToken,
   verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  });

    const origin = req.nextUrl.origin;
    const verifyLink = `${origin}/verify-email?token=${rawToken}`;

    try {
      await resend.emails.send({
        // Resend's free tier default sender — works without verifying your
        // own domain, good enough for dev/testing.
        // from: "StudentBlog <onboarding@resend.dev>",
        from: "StudentBlog <noreply@yourdomain.com>",
        to: email,
        subject: "Verify your StudentBlog account",
        html: `<p>Hi ${name},</p><p>Click below to verify your email:</p><p><a href="${verifyLink}">${verifyLink}</a></p><p>This link expires in 24 hours.</p>`,
      });
    } catch (emailErr) {
      // Don't fail registration just because the email didn't send —
      // account still exists, they can request a new verification link.
      console.error("Verification email failed to send:", emailErr);
    }

    return NextResponse.json(
      { id: user._id, username: user.username, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err); // detailed log server-side only
    return NextResponse.json(
      { error: "Something went wrong. Please try again." }, // safe message client-side
      { status: 500 }
    );
  }
}
