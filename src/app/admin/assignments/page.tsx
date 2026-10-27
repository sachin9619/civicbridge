"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { Assignment } from "@/types";

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("assignments")
        .select("*, complaint:complaints(title, tracking_id, status), assigned_to_profile:profiles!assignments_assigned_to_fkey(full_name), department:departments(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      setAssignments(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Assignments</h1>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Assignments will appear when complaints are assigned to employees." />
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{a.complaint?.title || "Untitled"}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-mono">{a.complaint?.tracking_id}</span>
                      <span>→ {a.assigned_to_profile?.full_name}</span>
                      {a.department?.name && <Badge variant="default" className="text-[10px]">{a.department.name}</Badge>}
                    </div>
                    {a.notes && <p className="text-xs text-slate-500 mt-1">{a.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={a.is_active ? "success" : "default"} className="text-[10px]">{a.is_active ? "Active" : "Inactive"}</Badge>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(a.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
