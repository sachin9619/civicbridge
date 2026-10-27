"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { PlusCircle, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { Complaint } from "@/types";

export default function CitizenDashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role === "admin") {
        router.replace("/admin");
        return;
      } else if (profile.role === "employee") {
        router.replace("/employee");
        return;
      }
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const items = data || [];
      setComplaints(items);
      setStats({
        total: items.length,
        active: items.filter((c) => !["RESOLVED", "REJECTED"].includes(c.status)).length,
        resolved: items.filter((c) => c.status === "RESOLVED").length,
        pending: items.filter((c) => c.status === "PENDING_VERIFICATION").length,
      });
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Complaints", value: stats.total, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Active", value: stats.active, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { label: "Pending Review", value: stats.pending, icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Citizen"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your complaints and report new issues</p>
        </div>
        <Link href="/dashboard/report">
          <Button variant="primary">
            <PlusCircle className="h-4 w-4" /> Report Issue
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-10 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                  )}
                </div>
                <div className={`rounded-lg p-2.5 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Complaints</CardTitle>
          <Link href="/dashboard/complaints" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : complaints.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No complaints yet"
              description="You haven't reported any issues. Report your first civic issue to get started."
              action={
                <Link href="/dashboard/report">
                  <Button variant="primary" size="sm"><PlusCircle className="h-4 w-4" /> Report Issue</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <Link key={c.id} href={`/dashboard/complaints/${c.id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.tracking_id} · {formatRelativeTime(c.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={c.status} className="ml-3 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
