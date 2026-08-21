import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    
    const user = await User.findByIdAndUpdate(
  session.user.id,
  {
    $set: {
      name,
      college,
      bio,
      avatarStyle,
    },
  },
  {
    returnDocument: "after",
    runValidators: true,
  }
)
  .select("name username avatarSeed avatarStyle bio college role")
  .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const college =
      typeof body.college === "string" ? body.college.trim() : "";

    const bio =
      typeof body.bio === "string" ? body.bio.trim() : "";

      const avatarStyle =
  typeof body.avatarStyle === "string"
    ? body.avatarStyle
    : "identicon";
    // Basic server-side validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (name.length > 80) {
      return NextResponse.json(
        { error: "Name must be 80 characters or less" },
        { status: 400 }
      );
    }

    if (college.length > 120) {
      return NextResponse.json(
        { error: "College must be 120 characters or less" },
        { status: 400 }
      );
    }

    if (bio.length > 300) {
      return NextResponse.json(
        { error: "Bio must be 300 characters or less" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          name,
          college,
          bio,
          avatarStyle,

        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    )
      .select("name username avatarSeed bio college role")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}