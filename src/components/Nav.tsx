"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import UserAvatar from "@/components/UserAvatar";
import NotificationBell from "@/components/NotificationBell";


export default function Nav() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold tracking-tight text-lg text-indigo-950"
        >
          Student<span className="text-indigo-600">Blog</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {status === "loading" ? null : session?.user ? (
            <>
              <Link
                href="/dashboard/posts/new"
                className="text-neutral-700 hover:text-indigo-700"
              >
                Write
              </Link>

                            <Link
                href="/dashboard"
                className="text-neutral-700 hover:text-indigo-700"
              >
                Dashboard
              </Link>

              <NotificationBell />

              {/* Avatar + dropdown */}

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen(!open)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Open profile menu"
                >
                  <UserAvatar
                    seed={
                      session.user.avatarSeed || session.user.username
                    }
                      style={(session.user as any).avatarStyle || "identicon"}
                    size={36}
                  />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="font-medium text-neutral-900">
                        {session.user.name}
                      </p>

                      <p className="text-sm text-neutral-500">
                        @{session.user.username}
                      </p>
                    </div>

                                      <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        My Profile
                      </Link>

                      <Link
                        href="/profile/edit"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        Edit Profile
                      </Link>

                                            <Link
                        href="/dashboard/saved"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        Saved Posts
                      </Link>

                                            {(session.user as any).role === "ADMIN" && (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          >
                            Admin — All Posts
                          </Link>
                          <Link
                            href="/admin/reports"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          >
                            Admin — Reports
                          </Link>
                        </>
                      )}
                    </div>    

                    <div className="border-t border-neutral-100 py-1">
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-neutral-700 hover:text-indigo-700"
              >
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