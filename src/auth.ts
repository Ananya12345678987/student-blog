import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    // JWT sessions: the session data lives in a signed, httpOnly cookie
    // rather than a server-side session table. Simpler to run for free
    // (no session store to manage) at the cost of not being able to
    // instantly revoke a session server-side — acceptable for an MVP.
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();

        // .select('+passwordHash') is required because the User schema
        // excludes passwordHash by default (see models/User.ts).
        const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash");
        if (!user) return null; // don't reveal "no such user" vs "wrong password"

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Copy id/username/role onto the JWT at login time...
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    // ...and expose them on the session object so server components and
    // API routes can read session.user.id / .role without another DB call.
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
