"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  _id: string;
  type: "LIKE" | "COMMENT" | "BOOKMARK" | "FOLLOW";
  actor: { name: string; username: string } | null;
  post: { title: string; slug: string } | null;
  read: boolean;
  createdAt: string;
};

const VERBS: Record<Notification["type"], string> = {
  LIKE: "liked",
  COMMENT: "commented on",
  BOOKMARK: "saved",
  FOLLOW: "started following you",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

    async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setLoaded(true);
    } catch {
      // Network hiccup or a request cancelled by page navigation/dev
      // server reload — safe to ignore, the next 30s poll will retry.
    }
  }

  useEffect(() => {
    load();
    // Light polling so the badge updates without a full page reload.
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      await fetch("/api/notifications/read", { method: "POST" });
      setUnreadCount(0);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-full p-1.5 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border border-neutral-200 bg-white shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-neutral-100 font-medium text-neutral-900 text-sm">
            Notifications
          </div>

          {!loaded ? (
            <p className="px-4 py-6 text-sm text-neutral-400 text-center">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-400 text-center">
              No notifications yet.
            </p>
          ) : (
            <ul>
              {notifications.map((n) => (
                            <li key={n._id} className="border-b border-neutral-50 last:border-0">
                  {n.type === "FOLLOW" ? (
                    <Link
                      href={`/profile/${n.actor?.username}`}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 text-sm hover:bg-neutral-50"
                    >
                      <span className="font-medium">{n.actor?.name ?? "Someone"}</span>{" "}
                      {VERBS[n.type]}
                      <span className="block text-xs text-neutral-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ) : n.post ? (
                    <Link
                      href={`/blog/${n.post.slug}`}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 text-sm hover:bg-neutral-50"
                    >
                      <span className="font-medium">{n.actor?.name ?? "Someone"}</span>{" "}
                      {VERBS[n.type]} your post{" "}
                      <span className="text-neutral-500">"{n.post.title}"</span>
                      <span className="block text-xs text-neutral-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ) : (
                    <div className="px-4 py-3 text-sm text-neutral-400">
                      A post this notification referenced no longer exists.
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}