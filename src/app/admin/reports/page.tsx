import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Report from "@/models/Report";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user) redirect("/login");
  if (role !== "ADMIN") redirect("/dashboard");

  await connectDB();
  const reports = await Report.find({})
    .sort({ createdAt: -1 })
    .populate("reporter", "name username")
    .lean();

  return (
    <div>
                <h1 className="font-display text-3xl text-ink mb-6 border-b border-rule pb-4">Reports</h1>

      {reports.length === 0 ? (
        <p className="text-ink/40">No reports yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {reports.map((r: any) => (
            <li key={r._id} className="py-4">
              <p className="text-sm">
                <span className="font-medium text-ink">{r.targetType}</span> reported by{" "}
                {r.reporter?.name ?? "Unknown"} (@{r.reporter?.username ?? "?"})
              </p>
              <p className="text-sm text-ink/70 mt-1">"{r.reason}"</p>
              <p className="text-xs text-ink/40 mt-1">
                Target ID: {r.targetId.toString()} ·{" "}
                {new Date(r.createdAt).toLocaleDateString()} · {r.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}