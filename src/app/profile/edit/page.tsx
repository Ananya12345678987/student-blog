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

  // Load the current profile from MongoDB
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

    console.error("PROFILE API STATUS:", res.status);
    console.error("PROFILE API RESPONSE:", errorText);

    throw new Error(
      `Profile API failed: ${res.status} ${errorText}`
  );
}

        const data = await res.json();

        setName(data.name ?? "");
        setCollege(data.college ?? "");
        setBio(data.bio ?? "");

        setAvatarSeed(
          data.avatarSeed ?? session?.user?.username ?? ""
        );

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          college,
          bio,
          avatarStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
  setError(data.error || "Failed to update profile.");
  setSaving(false);
  return;
}

// Push the updated fields into the JWT immediately, so the navbar
// avatar/name reflect the change without needing a logout/login.
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
    return (
      <div className="text-sm text-neutral-500">
        Loading profile...
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-indigo-950">
          Edit Profile
        </h1>

        <p className="text-sm text-neutral-500 mt-1">
          Update your StudentBlog profile.
        </p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center mb-8">
        <UserAvatar
          seed={avatarSeed || session.user.username}
          style={avatarStyle}
          size={120}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Avatar Style */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Choose Avatar Style
          </label>

          <div className="grid grid-cols-3 gap-4">
            {avatarStyles.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setAvatarStyle(style)}
                className={`p-3 rounded-lg border transition ${
                  avatarStyle === style
                    ? "border-indigo-600 ring-2 ring-indigo-200"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <div className="flex justify-center">
                  <UserAvatar
                    seed={avatarSeed || session.user.username}
                    style={style}
                    size={70}
                  />
                </div>

                <p className="text-xs text-neutral-600 mt-2 capitalize">
                  {style.replace("-", " ")}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            className="input w-full"
            placeholder="Your name"
          />
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Username
          </label>

          <input
            id="username"
            type="text"
            value={session.user.username}
            disabled
            className="input w-full bg-neutral-100 text-neutral-500"
          />

          <p className="text-xs text-neutral-400 mt-1">
            Username cannot be changed right now.
          </p>
        </div>

        {/* College */}
        <div>
          <label
            htmlFor="college"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            College
          </label>

          <input
            id="college"
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            maxLength={120}
            className="input w-full"
            placeholder="Your college"
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Bio
          </label>

          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={5}
            className="input w-full"
            placeholder="Tell other students about yourself..."
          />

          <p className="text-xs text-neutral-400 mt-1 text-right">
            {bio.length}/300
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}