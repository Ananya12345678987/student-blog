"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Nav() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-lg text-indigo-950">
          Student<span className="text-indigo-600">Blog</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {status === "loading" ? null : session?.user ? (
            <>
              <Link href="/dashboard/posts/new" className="text-neutral-700 hover:text-indigo-700">
                Write
              </Link>
              <Link href="/dashboard" className="text-neutral-700 hover:text-indigo-700">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-neutral-500 hover:text-neutral-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-700 hover:text-indigo-700">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 text-white px-3 py-1.5 hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
