"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FileText, Search, Filter, Eye, ArrowUpRight, ShieldAlert, Building2 } from "lucide-react";
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

  const categories = [
    { key: "ALL", label: "सभी श्रेणियां / All Categories" },
    { key: "GARBAGE_WASTE", label: "ठोस अपशिष्ट / Garbage & Waste" },
    { key: "POTHOLE_ROADS", label: "सड़क एवं गड्ढे / Potholes & Roads" },
    { key: "STREETLIGHTS", label: "मार्ग प्रकाश / Streetlights" },
    { key: "DRAINAGE_SEWAGE", label: "जल निकासी / Drainage & Sewage" },
    { key: "WATER_SUPPLY", label: "जलापूर्ति / Water Supply" },
    { key: "WOMEN_SAFETY", label: "महिला सुरक्षा / Women Safety" },
    { key: "PUBLIC_INFRASTRUCTURE", label: "सार्वजनिक अवसंरचना / Infrastructure" },
    { key: "OTHER", label: "अन्य / Other" },
  ];

  return (
    <div className="space-y-6">
      {/* Official Government Admin Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider text-[#d32f2f] uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                नागरिक शिकायत पंजीयन रजिस्टर
              </span>
              <span className="text-[11px] font-medium text-slate-500">Central Grievance Master Register</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              समस्त नागरिक शिकायतें <span className="text-slate-400 font-normal">|</span> All Grievances Registry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              सभी नगर निगम वार्डों एवं विभागों से प्राप्त शिकायतों का केंद्रीकृत प्रबंधन एवं निगरानी
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-[#002B49] bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
              कुल प्रविष्टियां: {filtered.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="शीर्षक, ट्रैकिंग आईडी अथवा विवरण द्वारा खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B49] bg-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49]"
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 items-center">
          {statuses.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s.key
                  ? "bg-[#002B49] text-white shadow-xs"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="कोई शिकायत नहीं मिली | No Complaints Found"
          description="दिए गए खोज या फ़िल्टर मापदंडों के अनुसार कोई रिकॉर्ड उपलब्ध नहीं है।"
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <Link key={c.id} href={`/admin/complaints/${c.id}`}>
              <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white border-slate-200 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {c.tracking_id}
                        </span>
                        <StatusBadge status={c.status} />
                        <Badge variant={c.priority === "URGENT" ? "error" : c.priority === "HIGH" ? "warning" : "default"} className="text-[10px] font-bold">
                          {c.priority}
                        </Badge>
                        {c.is_sensitive && (
                          <span className="text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> गोपनीय / SENSITIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                        {c.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{c.category.replace(/_/g, " ")}</span>
                        {(c as any).department?.name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {(c as any).department.name}
                          </span>
                        )}
                        <span>• {formatRelativeTime(c.created_at)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-700 group-hover:text-blue-900 mt-1">
                      कार्यवाही करें
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
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
