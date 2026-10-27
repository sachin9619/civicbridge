"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Complaint } from "@/types";

export default function AdminAnalyticsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("complaints").select("*");
      setComplaints(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  if (isLoading) return <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;

  const total = complaints.length;
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  complaints.forEach((c) => {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
  });

  const resolved = complaints.filter((c) => c.status === "RESOLVED");
  const avgResolutionMs = resolved.length > 0
    ? resolved.reduce((acc, c) => acc + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()), 0) / resolved.length
    : 0;
  const avgResolutionDays = Math.round(avgResolutionMs / 86400000);

  const Bar = ({ entries, color }: { entries: [string, number][]; color: string }) => (
    <div className="space-y-2">
      {entries.sort(([, a], [, b]) => b - a).map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-slate-600 w-36 truncate">{label.replace(/_/g, " ")}</span>
          <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
          </div>
          <span className="text-xs font-medium text-slate-500 w-8 text-right">{count}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Analytics</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-slate-900">{total}</p>
          <p className="text-xs text-slate-500">Total Complaints</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{resolved.length}</p>
          <p className="text-xs text-slate-500">Resolved</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{avgResolutionDays || "—"}</p>
          <p className="text-xs text-slate-500">Avg. Resolution (days)</p>
        </CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader>
          <CardContent><Bar entries={Object.entries(byCategory)} color="bg-blue-500" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
          <CardContent><Bar entries={Object.entries(byStatus)} color="bg-emerald-500" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">By Priority</CardTitle></CardHeader>
          <CardContent><Bar entries={Object.entries(byPriority)} color="bg-amber-500" /></CardContent>
        </Card>
      </div>
    </div>
  );
}
