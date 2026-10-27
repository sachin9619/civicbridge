"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { Complaint } from "@/types";

export default function EmployeeCompletedPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchTasks = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .eq("assigned_employee_id", profile.id)
        .in("status", ["RESOLVED", "REJECTED"])
        .order("updated_at", { ascending: false });
      setTasks(data || []);
      setIsLoading(false);
    };
    fetchTasks();
  }, [profile]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Completed Tasks</h1>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No completed tasks" description="Tasks you complete will appear here." />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Link key={t.id} href={`/employee/task/${t.id}`}>
              <Card className="hover:border-blue-200 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.tracking_id} · {formatRelativeTime(t.updated_at)}</p>
                  </div>
                  <StatusBadge status={t.status} className="ml-3 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
