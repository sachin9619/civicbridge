"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  FileText, Clock, CheckCircle2, AlertCircle, Users, BarChart3,
  ArrowUpRight, TrendingUp, AlertTriangle, UserCheck, Shield, Building2, MapPin,
  Flame, Zap, RotateCw, Sparkles, Loader2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SLABadge } from "@/components/ui/sla-badge";
import { isComplaintOverdue } from "@/lib/sla";
import { formatRelativeTime } from "@/lib/utils";
import type { Complaint } from "@/types";
import { AdminAICopilot } from "@/components/ai/admin-ai-copilot";

interface DashboardStats {
  total: number;
  submitted: number;
  underReview: number;
  assigned: number;
  inProgress: number;
  pendingVerification: number;
  resolved: number;
  rejected: number;
}

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // SLA Escalation Trigger state
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationResult, setEscalationResult] = useState<{
    evaluated: number;
    escalatedCount: number;
    alreadyEscalatedCount: number;
    message?: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // Fetch all complaints
    const { data: complaints } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    const all = complaints || [];
    setAllComplaints(all);
    setRecentComplaints(all.slice(0, 8));

    setStats({
      total: all.length,
      submitted: all.filter((c) => c.status === "SUBMITTED").length,
      underReview: all.filter((c) => c.status === "UNDER_REVIEW").length,
      assigned: all.filter((c) => c.status === "ASSIGNED").length,
      inProgress: all.filter((c) => c.status === "IN_PROGRESS").length,
      pendingVerification: all.filter((c) => c.status === "PENDING_VERIFICATION").length,
      resolved: all.filter((c) => c.status === "RESOLVED").length,
      rejected: all.filter((c) => c.status === "REJECTED").length,
    });

    // Category distribution
    const cats: Record<string, number> = {};
    all.forEach((c) => { cats[c.category] = (cats[c.category] || 0) + 1; });
    setCategoryStats(cats);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live trigger for SLA Escalation Engine
  const handleTriggerEscalation = async () => {
    setIsEscalating(true);
    setEscalationResult(null);
    try {
      const res = await fetch("/api/sla/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setEscalationResult(data);
      // Refresh dashboard complaints to reflect elevated priority
      await fetchData();
    } catch (err: any) {
      setEscalationResult({
        evaluated: 0,
        escalatedCount: 0,
        alreadyEscalatedCount: 0,
        message: err.message || "Failed to run escalation engine",
      });
    } finally {
      setIsEscalating(false);
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900">अनधिकृत पहुँच | Access Denied</h2>
        <p className="text-sm text-slate-500 mt-1">You need administrative authority to access the Municipal Command Center.</p>
      </div>
    );
  }

  const overdueComplaintsCount = allComplaints.filter((c) => isComplaintOverdue(c)).length;
  const mappedCount = allComplaints.filter((c) => c.latitude && c.longitude && !c.is_sensitive).length;

  const kpis = [
    { labelHi: "कुल शिकायतें", labelEn: "Total Complaints", value: stats?.total, icon: FileText, color: "text-blue-700 bg-blue-50 border-l-4 border-l-blue-600" },
    { labelHi: "समीक्षाधीन", labelEn: "Awaiting Review", value: (stats?.submitted || 0) + (stats?.underReview || 0), icon: Clock, color: "text-amber-700 bg-amber-50 border-l-4 border-l-amber-500" },
    { labelHi: "आवंटित / प्रगति पर", labelEn: "Assigned / Active", value: (stats?.assigned || 0) + (stats?.inProgress || 0), icon: UserCheck, color: "text-purple-700 bg-purple-50 border-l-4 border-l-purple-600" },
    { labelHi: "सत्यापन लंबित", labelEn: "Pending Verification", value: stats?.pendingVerification, icon: AlertCircle, color: "text-orange-700 bg-orange-50 border-l-4 border-l-orange-500" },
    { labelHi: "सत्यापित एवं निस्तारित", labelEn: "Resolved / Closed", value: stats?.resolved, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 border-l-4 border-l-emerald-600" },
    { labelHi: "अस्वीकृत", labelEn: "Rejected / Invalid", value: stats?.rejected, icon: AlertTriangle, color: "text-red-700 bg-red-50 border-l-4 border-l-red-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Official Government Admin Cockpit Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-lg bg-[#002B49] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              <Building2 className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-[#d32f2f] uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  भारत सरकार • GOI MUNICIPAL ERP
                </span>
                <span className="text-[11px] font-medium text-slate-500">वार्ड संचालन नियंत्रण</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                कमान एवं नियंत्रण केंद्र <span className="text-slate-400 font-normal">|</span> Command & Control Center
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                राष्ट्रीय नागरिक शिकायत निवारण एवं शहरी शासन प्रबंधन • MoHUA Integrated Governance Grid
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/map"
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              स्थानिक हीटमैप (GIS)
            </Link>
            <Link
              href="/admin/complaints"
              className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#002B49] hover:bg-[#00385f] text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              सभी शिकायतें देखें
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* CivicBridge Smart Civic Intelligence Operations Banner */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 shadow-xs relative overflow-hidden">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-red-500" />
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                  <Zap className="h-3 w-3" />
                </span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  स्मार्ट नागरिक बुद्धिमत्ता एवं SLA इंजन • Smart Civic Operations
                </span>
                <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-800">
                  Citizen Charter SLA Matrix
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                स्वचालित SLA ट्रैकिंग, समय सीमा पार शिकायतों का स्वतः एस्केलेशन, 450m भू-स्थानिक क्लस्टरिंग और डुप्लिकेट पहचान।
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right pr-2 hidden sm:block border-r border-amber-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">SLA उल्लंघन स्थिति</span>
                <span className="text-xs font-bold text-red-700">
                  {overdueComplaintsCount} शिकायतें समय सीमा पार
                </span>
              </div>

              <Button
                size="sm"
                onClick={handleTriggerEscalation}
                disabled={isEscalating}
                className="h-8 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-xs"
              >
                {isEscalating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5 text-amber-200" />}
                {isEscalating ? "एस्केलेशन जांच जारी..." : "SLA स्वतः एस्केलेशन चलाएं (Run Auto-Escalate)"}
              </Button>
            </div>
          </div>

          {/* Escalation Execution Feedback Banner */}
          {escalationResult && (
            <div className="mt-3 p-3 rounded-lg bg-white border border-amber-300 text-xs text-slate-800 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>SLA जांच पूर्ण:</strong> कुल {escalationResult.evaluated} शिकायतों का विश्लेषण किया गया।{" "}
                  {escalationResult.escalatedCount > 0 ? (
                    <span className="text-red-700 font-bold font-mono">
                      {escalationResult.escalatedCount} शिकायतें &quot;URGENT&quot; स्तर पर एस्केलेट की गईं।
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      कोई नई शिकायत समय सीमा पार नहीं पाई गई।
                    </span>
                  )}{" "}
                  ({escalationResult.alreadyEscalatedCount} पूर्व में एस्केलेटेड - Idempotent, कोई दोहराव नहीं)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEscalationResult(null)}
                className="h-6 text-[11px] text-slate-400 hover:text-slate-600 px-1.5"
              >
                ✕
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Copilot Panel */}
      <AdminAICopilot context={{ intent: "analytics" }} />

      {/* KPIs with Government Bilingual Styling */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {kpis.map((kpi) => (
          <div key={kpi.labelEn} className={`bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs ${kpi.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">{kpi.labelHi}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{kpi.labelEn}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900 mt-1.5 font-mono">{kpi.value ?? 0}</p>
                )}
              </div>
              <div className="rounded-md p-1.5 bg-white/80 shadow-xs">
                <kpi.icon className="h-4 w-4 text-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  हालिया पंजीकृत शिकायतें <span className="text-xs text-slate-500 font-normal">| Recent Complaints Dossier</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Real-time civic grievances awaiting municipal adjudication</p>
              </div>
              <Link href="/admin/complaints" className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1">
                पूर्ण सूची <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : recentComplaints.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">कोई सक्रिय शिकायत दर्ज नहीं है | No complaints recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentComplaints.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/complaints/${c.id}`}
                      className="flex items-center justify-between py-3 hover:bg-slate-50/80 -mx-2 px-3 rounded-lg transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {c.tracking_id}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatRelativeTime(c.created_at)}
                          </span>
                          <SLABadge complaint={c} />
                          {c.is_sensitive && (
                            <span className="text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-1.5 rounded">
                              गोपनीय
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                          {c.title}
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

        {/* Category Distribution */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              श्रेणीवार वितरण <span className="text-xs text-slate-500 font-normal">| By Category</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Distribution across urban departments</p>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : Object.keys(categoryStats).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">कोई डेटा उपलब्ध नहीं | No data yet.</p>
            ) : (
              <div className="space-y-3.5">
                {Object.entries(categoryStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => {
                    const pct = Math.round((count / (stats?.total || 1)) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-slate-700 capitalize">{cat.replace(/_/g, " ").toLowerCase()}</span>
                          <span className="text-slate-500 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
