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
    <header className="border-b border-rule bg-paper">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl text-ink"
        >
          Student<span className="text-marker">Blog</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {status === "loading" ? null : session?.user ? (
            <>
              <Link
                href="/dashboard/posts/new"
                className="text-ink/70 hover:text-ink transition"
              >
                Write
              </Link>

                            <Link
                href="/dashboard"
                className="text-ink/70 hover:text-ink transition"
              >
                Dashboard
              </Link>

              <Link
                href="/feed"
                className="text-ink/70 hover:text-ink transition"
              >
                Following
              </Link>

              <NotificationBell />

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen(!open)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-marker"
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
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-rule bg-paper shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-rule">
                      <p className="font-medium text-ink">
                        {session.user.name}
                      </p>

                      <p className="text-sm text-ink/60">
                        @{session.user.username}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-ink/80 hover:bg-ink/5"
                      >
                        My Profile
                      </Link>

                      <Link
                        href="/profile/edit"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-ink/80 hover:bg-ink/5"
                      >
                        Edit Profile
                      </Link>

                      <Link
                        href="/dashboard/saved"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-ink/80 hover:bg-ink/5"
                      >
                        Saved Posts
                      </Link>

                      {(session.user as any).role === "ADMIN" && (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-2 text-sm text-moss hover:bg-ink/5"
                          >
                            Admin — All Posts
                          </Link>
                          <Link
                            href="/admin/reports"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-2 text-sm text-moss hover:bg-ink/5"
                          >
                            Admin — Reports
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-rule py-1">
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2 text-sm text-pen-red hover:bg-pen-red/5"
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
                className="text-ink/70 hover:text-ink transition"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="rounded-md bg-ink text-paper px-3 py-1.5 hover:bg-ink/90 transition"
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