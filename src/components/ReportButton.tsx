"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "POST" | "COMMENT";
  targetId: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const reason = window.prompt(
      `Why are you reporting this ${targetType.toLowerCase()}?`
    );
    if (!reason || !reason.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason }),
    });
    setSubmitting(false);

    if (res.ok) {
      setDone(true);
    } else {
      alert("Failed to submit report. Please try again.");
    }
  }

  if (done) {
    return <span className="text-xs text-ink/40">Reported</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      className="text-xs text-ink/40 hover:text-pen-red hover:underline disabled:opacity-50"
    >
      {submitting ? "Reporting…" : "Report"}
    </button>
  );
}