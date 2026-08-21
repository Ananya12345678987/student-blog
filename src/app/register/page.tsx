"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Something went wrong.");
      return;
    }

    // Registration succeeded — sign the user in immediately rather than
    // making them fill out the login form again.
    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.ok) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold text-indigo-950 mb-1">Create your account</h1>
      <p className="text-sm text-neutral-500 mb-6">Write, publish, and share with your college community.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            autoComplete="name"
          />
        </Field>

        <Field label="Username" hint="Your public URL will be /@username">
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            className="input"
            pattern="[a-z0-9_]+"
            title="Lowercase letters, numbers, and underscores only"
            autoComplete="username"
          />
        </Field>

        <Field label="Email">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" hint="At least 8 characters, with a letter and a number">
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input"
            autoComplete="new-password"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 text-white py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-neutral-500 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-800 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-400 mt-1">{hint}</span>}
    </label>
  );
}
