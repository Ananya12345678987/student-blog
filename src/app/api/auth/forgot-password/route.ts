import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: parsed.data.email });

    // Same "don't leak which emails exist" principle as login — but since
    // this is a DEV-ONLY flow that hands the link back in the response
    // (no email sent), we only have something to show if a user was
    // actually found. When this is upgraded to send a real email, this
    // response should become identical in both cases so an attacker can't
    // use it to enumerate registered emails.
    if (!user) {
      return NextResponse.json({
        message: "If that email is registered, a reset link has been generated.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const origin = req.nextUrl.origin;
    const resetLink = `${origin}/reset-password?token=${rawToken}`;

    // DEV-ONLY: returning the link directly in the API response so you can
    // test the flow without an email service. Before real deployment,
    // replace this with actually sending `resetLink` via email (e.g.
    // Resend) and remove `resetLink` from the JSON response.
    return NextResponse.json({
      message: "If that email is registered, a reset link has been generated.",
      resetLink,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}