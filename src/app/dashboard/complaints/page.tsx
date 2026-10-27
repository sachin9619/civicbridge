"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FileText, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { Complaint } from "@/types";

export default function ComplaintsListPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filtered, setFiltered] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      setComplaints(data || []);
      setFiltered(data || []);
      setIsLoading(false);
    };
    fetchComplaints();
  }, []);

  useEffect(() => {
    let result = complaints;
    if (statusFilter !== "ALL") result = result.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(q) || c.tracking_id.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statusFilter, complaints]);

  const statuses = ["ALL", "SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION", "RESOLVED", "REJECTED"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900">My Complaints</h1>
        <Link href="/dashboard/report">
          <Button variant="primary" size="sm"><PlusCircle className="h-4 w-4" /> Report Issue</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || statusFilter !== "ALL" ? "No matching complaints" : "No complaints yet"}
          description={search || statusFilter !== "ALL" ? "Try adjusting your search or filters." : "Report your first civic issue to get started."}
          action={!search && statusFilter === "ALL" ? (
            <Link href="/dashboard/report"><Button variant="primary" size="sm"><PlusCircle className="h-4 w-4" /> Report Issue</Button></Link>
          ) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} href={`/dashboard/complaints/${c.id}`}>
              <Card className="hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{c.tracking_id}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{c.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(c.created_at)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
