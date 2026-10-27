"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Briefcase, Clock, AlertTriangle, MapPin, Calendar } from "lucide-react";
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
        <p className="text-sm text-slate-500 mt-1">Employee access required.</p>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => ["ASSIGNED", "IN_PROGRESS"].includes(t.status));
  const pendingTasks = tasks.filter((t) => t.status === "PENDING_VERIFICATION");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">{activeTasks.length} active task{activeTasks.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{activeTasks.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{pendingTasks.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Pending Review</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{tasks.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={Briefcase} title="No tasks assigned" description="You don't have any active tasks at the moment." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link key={task.id} href={`/employee/task/${task.id}`}>
              <Card className="hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <Badge variant={task.priority === "URGENT" ? "error" : task.priority === "HIGH" ? "warning" : "default"} className="text-[10px]">{task.priority}</Badge>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(task.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-1">{task.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {task.category.replace(/_/g, " ")}</span>
                    {task.address && <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin className="h-3 w-3" /> {task.address}</span>}
                    {task.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due: {formatDate(task.deadline)}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
