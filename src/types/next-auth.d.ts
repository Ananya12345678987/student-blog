import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    avatarSeed: string;
    role: "STUDENT" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      username: string;
      avatarSeed: string;
      role: "STUDENT" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    avatarSeed?: string;
    role?: "STUDENT" | "ADMIN";
  }
}