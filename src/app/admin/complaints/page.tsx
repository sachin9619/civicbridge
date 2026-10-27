"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FileText, Search, Filter, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { Complaint } from "@/types";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filtered, setFiltered] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("complaints")
        .select("*, department:departments(name), ward:wards(name)")
        .order("created_at", { ascending: false });
      setComplaints(data || []);
      setFiltered(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    let result = complaints;
    if (statusFilter !== "ALL") result = result.filter((c) => c.status === statusFilter);
    if (categoryFilter !== "ALL") result = result.filter((c) => c.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(q) || c.tracking_id.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statusFilter, categoryFilter, complaints]);

  const statuses = ["ALL","SUBMITTED","UNDER_REVIEW","ASSIGNED","IN_PROGRESS","PENDING_VERIFICATION","RESOLVED","REJECTED"];
  const categories = ["ALL","GARBAGE_WASTE","POTHOLE_ROADS","STREETLIGHTS","DRAINAGE_SEWAGE","WATER_SUPPLY","WOMEN_SAFETY","PUBLIC_INFRASTRUCTURE","OTHER"];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">All Complaints</h1>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search by title, ID, or description..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {categories.map((c) => <option key={c} value={c}>{c === "ALL" ? "All Categories" : c.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">{filtered.length} complaint{filtered.length !== 1 ? "s" : ""}</p>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No complaints found" description="Try adjusting your filters or search query." />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} href={`/admin/complaints/${c.id}`}>
              <Card className="hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">{c.tracking_id}</span>
                        <StatusBadge status={c.status} />
                        <Badge variant={c.priority === "URGENT" ? "error" : c.priority === "HIGH" ? "warning" : "default"} className="text-[10px]">{c.priority}</Badge>
                        {c.is_sensitive && <Badge variant="error" className="text-[10px]">SENSITIVE</Badge>}
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{c.category.replace(/_/g, " ")}</span>
                        {(c as any).department?.name && <span>· {(c as any).department.name}</span>}
                        <span>· {formatRelativeTime(c.created_at)}</span>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
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
