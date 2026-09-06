"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/UserAvatar";

const avatarStyles = [
  "identicon",
  "adventurer",
  "bottts",
  "fun-emoji",
  "lorelei",
  "notionists",
];

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [bio, setBio] = useState("");

  const [avatarSeed, setAvatarSeed] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("identicon");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Profile API failed: ${res.status} ${errorText}`);
        }

        const data = await res.json();

        setName(data.name ?? "");
        setCollege(data.college ?? "");
        setBio(data.bio ?? "");
        setAvatarSeed(data.avatarSeed ?? session?.user?.username ?? "");
        setAvatarStyle(data.avatarStyle ?? "identicon");
      } catch (err) {
        console.error(err);
        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [status, router, session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, college, bio, avatarStyle }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
        setSaving(false);
        return;
      }

      await update({
        name: data.user.name,
        avatarStyle: data.user.avatarStyle,
      });

      router.push("/profile");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  if (loading || status === "loading") {
    return <div className="text-sm text-ink/50">Loading profile...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink">Edit Profile</h1>
        <p className="text-sm text-ink/60 mt-1">Update your StudentBlog profile.</p>
      </div>

      <div className="flex justify-center mb-8">
        <UserAvatar
          seed={avatarSeed || session.user.username}
          style={avatarStyle}
          size={120}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-3">
            Choose Avatar Style
          </label>

          <div className="grid grid-cols-3 gap-4">
            {avatarStyles.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setAvatarStyle(style)}
                className={`p-3 rounded-md border transition ${
                  avatarStyle === style
                    ? "border-marker ring-2 ring-marker/20"
                    : "border-rule hover:border-ink/30"
                }`}
              >
                <div className="flex justify-center">
                  <UserAvatar
                    seed={avatarSeed || session.user.username}
                    style={style}
                    size={70}
                  />
                </div>
                <p className="text-xs text-ink/60 mt-2 capitalize">
                  {style.replace("-", " ")}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink/80 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            className="input"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-ink/80 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={session.user.username}
            disabled
            className="input bg-ink/5 text-ink/40"
          />
          <p className="text-xs text-ink/40 mt-1">Username cannot be changed right now.</p>
        </div>

        <div>
          <label htmlFor="college" className="block text-sm font-medium text-ink/80 mb-1">
            College
          </label>
          <input
            id="college"
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            maxLength={120}
            className="input"
            placeholder="Your college"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-ink/80 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={5}
            className="input"
            placeholder="Tell other students about yourself..."
          />
          <p className="text-xs text-ink/40 mt-1 text-right">{bio.length}/300</p>
        </div>

        {error && <p className="text-sm text-pen-red">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-ink text-paper px-4 py-2 text-sm hover:bg-ink/90 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="rounded-md border border-rule px-4 py-2 text-sm text-ink/70 hover:bg-ink/5 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}