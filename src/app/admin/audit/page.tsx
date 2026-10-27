"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/types";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("audit_logs")
        .select("*, actor:profiles!audit_logs_actor_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : logs.length === 0 ? (
        <EmptyState icon={Shield} title="No audit entries" description="Administrative actions will be logged here." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                    <Badge variant="default" className="text-[10px]">{log.entity_type}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    by {(log as any).actor?.full_name || "System"} · {log.entity_id.substring(0, 8)}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatDate(log.created_at)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
