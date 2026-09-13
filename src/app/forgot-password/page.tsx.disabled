"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setMessage(data.message);
  }

   

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-3xl text-ink mb-1">Forgot password</h1>
      <p className="text-sm text-ink/60 mb-6">
        Enter your account email and we'll generate a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-ink/80 mb-1">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
          />
        </label>

                {error && <p className="text-sm text-pen-red">{error}</p>}
        {message && <p className="text-sm text-moss">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-ink text-paper py-2.5 font-medium hover:bg-ink/90 transition disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-4">
        <Link href="/login" className="text-marker-dark hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}