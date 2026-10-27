"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FileText, Search, PlusCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const statuses = [
    { key: "ALL", label: "सभी / All" },
    { key: "SUBMITTED", label: "दर्ज / Submitted" },
    { key: "UNDER_REVIEW", label: "समीक्षाधीन / Review" },
    { key: "ASSIGNED", label: "आवंटित / Assigned" },
    { key: "IN_PROGRESS", label: "प्रगति पर / Active" },
    { key: "PENDING_VERIFICATION", label: "सत्यापन / Verifying" },
    { key: "RESOLVED", label: "निस्तारित / Resolved" },
    { key: "REJECTED", label: "अस्वीकृत / Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Official Government Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider text-[#d32f2f] uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                नागरिक निवारण रिकॉर्ड
              </span>
              <span className="text-[11px] font-medium text-slate-500">Citizen Redressal Dossier</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              मेरी पंजीकृत शिकायतें <span className="text-slate-400 font-normal">|</span> My Registered Complaints
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              आपके द्वारा दर्ज की गई सभी शिकायतों की वास्तविक समय स्थिति एवं इतिहास
            </p>
          </div>
          <Link href="/dashboard/report">
            <Button variant="primary" size="sm" className="bg-[#002B49] hover:bg-[#00385f] shadow-xs gap-1.5 shrink-0">
              <PlusCircle className="h-4 w-4" /> नई शिकायत दर्ज करें
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="शिकायत शीर्षक या ट्रैकिंग आईडी खोजें (Search)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B49] bg-white shadow-xs"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 items-center">
          {statuses.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s.key
                  ? "bg-[#002B49] text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.label}
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
          title={search || statusFilter !== "ALL" ? "कोई मेल खाती शिकायत नहीं मिली" : "कोई शिकायत दर्ज नहीं है"}
          description={search || statusFilter !== "ALL" ? "कृपया अपनी खोज या फ़िल्टर मानदंड बदलें।" : "शहरी समस्या के समाधान हेतु अपनी पहली शिकायत दर्ज करें।"}
          action={!search && statusFilter === "ALL" ? (
            <Link href="/dashboard/report">
              <Button variant="primary" size="sm" className="bg-[#002B49] hover:bg-[#00385f]">
                <PlusCircle className="h-4 w-4" /> नई शिकायत दर्ज करें
              </Button>
            </Link>
          ) : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <Link key={c.id} href={`/dashboard/complaints/${c.id}`}>
              <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white border-slate-200 group">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.tracking_id}
                      </span>
                      <StatusBadge status={c.status} />
                      {c.is_sensitive && (
                        <span className="text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded">
                          गोपनीय / Sensitive
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                      {c.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{c.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block">{formatRelativeTime(c.created_at)}</span>
                    <span className="text-xs font-semibold text-blue-600 flex items-center gap-0.5 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      विवरण <ArrowUpRight className="h-3 w-3" />
                    </span>
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
