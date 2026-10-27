"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Briefcase, Clock, AlertTriangle, MapPin, Calendar, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import type { Complaint } from "@/types";

export default function EmployeeDashboardPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchTasks = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("complaints")
        .select("*, department:departments(name), ward:wards(name)")
        .eq("assigned_employee_id", profile.id)
        .in("status", ["ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION"])
        .order("created_at", { ascending: false });
      setTasks(data || []);
      setIsLoading(false);
    };
    fetchTasks();
  }, [profile]);

  if (profile?.role !== "employee") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-500 mt-1">Authorized municipal field personnel access only.</p>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => ["ASSIGNED", "IN_PROGRESS"].includes(t.status));
  const pendingTasks = tasks.filter((t) => t.status === "PENDING_VERIFICATION");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#002d62] via-slate-800 to-emerald-950 text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="h-full w-1/3 bg-[#FF9933]" />
          <div className="h-full w-1/3 bg-white" />
          <div className="h-full w-1/3 bg-[#138808]" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10 pt-1">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
              क्षेत्रीय कार्य बल पोर्टल • FIELD OPERATIONS
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight mt-1">
              Field Officer: {profile.full_name}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Assigned municipal work orders requiring on-site repair, waste clearance, or evidence inspection.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
              Active Tasks: {activeTasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-blue-700">{activeTasks.length}</p>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">सक्रिय कार्य (Active Tasks)</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-purple-700">{pendingTasks.length}</p>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">निरीक्षण लंबित (Pending Verification)</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-slate-900">{tasks.length}</p>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">कुल कार्य (Total In Queue)</p>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>आवंटित कार्य आदेश (Assigned Work Orders)</span>
          <span className="text-xs font-normal text-slate-500">{tasks.length} total tasks</span>
        </h2>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="कोई कार्य आवंटित नहीं है"
            description="You currently have no pending tasks in your municipal work queue."
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link key={task.id} href={`/employee/task/${task.id}`}>
                <Card className="hover:border-blue-400 hover:shadow-md transition-all cursor-pointer border border-slate-200 bg-white">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-800">{task.tracking_id}</span>
                        <StatusBadge status={task.status} />
                        <Badge variant={task.priority === "URGENT" ? "error" : task.priority === "HIGH" ? "warning" : "default"} className="text-[10px]">
                          {task.priority}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(task.created_at)}</span>
                    </div>
                    <p className="text-base font-bold text-slate-900 mb-1">{task.title}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex flex-wrap gap-3">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Briefcase className="h-3.5 w-3.5 text-blue-700" /> {task.category.replace(/_/g, " ")}
                        </span>
                        {task.address && (
                          <span className="flex items-center gap-1 truncate max-w-[250px]">
                            <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" /> {task.address}
                          </span>
                        )}
                        {task.deadline && (
                          <span className="flex items-center gap-1 font-semibold text-amber-800">
                            <Calendar className="h-3.5 w-3.5" /> Due: {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-blue-800 flex items-center gap-1">
                        Open Work Order <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
