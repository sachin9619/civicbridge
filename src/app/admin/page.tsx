"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  FileText, Clock, CheckCircle2, AlertCircle, Users, BarChart3,
  ArrowUpRight, TrendingUp, AlertTriangle, UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Complaint } from "@/types";
import { AdminAICopilot } from "@/components/ai/admin-ai-copilot";

interface DashboardStats {
  total: number;
  submitted: number;
  underReview: number;
  assigned: number;
  inProgress: number;
  pendingVerification: number;
  resolved: number;
  rejected: number;
}

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Fetch all complaints
      const { data: complaints } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      const all = complaints || [];
      setRecentComplaints(all.slice(0, 8));

      setStats({
        total: all.length,
        submitted: all.filter((c) => c.status === "SUBMITTED").length,
        underReview: all.filter((c) => c.status === "UNDER_REVIEW").length,
        assigned: all.filter((c) => c.status === "ASSIGNED").length,
        inProgress: all.filter((c) => c.status === "IN_PROGRESS").length,
        pendingVerification: all.filter((c) => c.status === "PENDING_VERIFICATION").length,
        resolved: all.filter((c) => c.status === "RESOLVED").length,
        rejected: all.filter((c) => c.status === "REJECTED").length,
      });

      // Category distribution
      const cats: Record<string, number> = {};
      all.forEach((c) => { cats[c.category] = (cats[c.category] || 0) + 1; });
      setCategoryStats(cats);

      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (profile?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-500 mt-1">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const kpis = [
    { label: "Total Complaints", value: stats?.total, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Awaiting Review", value: (stats?.submitted || 0) + (stats?.underReview || 0), icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Assigned / In Progress", value: (stats?.assigned || 0) + (stats?.inProgress || 0), icon: UserCheck, color: "text-purple-600 bg-purple-50" },
    { label: "Pending Verification", value: stats?.pendingVerification, icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
    { label: "Resolved", value: stats?.resolved, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { label: "Rejected", value: stats?.rejected, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of civic complaints and operations</p>
        </div>
        <Link href="/admin/complaints">
          <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>

      {/* AI Copilot Panel */}
      <AdminAICopilot context={{ intent: "analytics" }} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 leading-tight">{kpi.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-12 mt-1.5" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                  )}
                </div>
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Complaints</CardTitle>
              <Link href="/admin/complaints" className="text-sm text-blue-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : recentComplaints.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No complaints recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentComplaints.map((c) => (
                    <Link key={c.id} href={`/admin/complaints/${c.id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-slate-400">{c.tracking_id}</span>
                          <span className="text-xs text-slate-400">{formatRelativeTime(c.created_at)}</span>
                        </div>
                      </div>
                      <StatusBadge status={c.status} className="ml-3 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : Object.keys(categoryStats).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{cat.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
