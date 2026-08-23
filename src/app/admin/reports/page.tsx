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
      <h1 className="text-2xl font-semibold text-indigo-950 mb-6">Reports</h1>

      {reports.length === 0 ? (
        <p className="text-neutral-400">No reports yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {reports.map((r: any) => (
            <li key={r._id} className="py-4">
              <p className="text-sm">
                <span className="font-medium">{r.targetType}</span> reported by{" "}
                {r.reporter?.name ?? "Unknown"} (@{r.reporter?.username ?? "?"})
              </p>
              <p className="text-sm text-neutral-600 mt-1">"{r.reason}"</p>
              <p className="text-xs text-neutral-400 mt-1">
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