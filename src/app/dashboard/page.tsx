"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { PlusCircle, FileText, Clock, CheckCircle2, AlertCircle, ShieldAlert, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { Complaint } from "@/types";
import { CitizenAIAssistant } from "@/components/ai/citizen-ai-assistant";
import { CivicPulseFeed } from "@/components/ai/civicpulse-feed";

export default function CitizenDashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role === "admin") {
        router.replace("/admin");
        return;
      } else if (profile.role === "employee") {
        router.replace("/employee");
        return;
      }
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const items = data || [];
      setComplaints(items);
      setStats({
        total: items.length,
        active: items.filter((c) => !["RESOLVED", "REJECTED"].includes(c.status)).length,
        resolved: items.filter((c) => c.status === "RESOLVED").length,
        pending: items.filter((c) => c.status === "PENDING_VERIFICATION").length,
      });
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "कुल शिकायतें / Total", value: stats.total, icon: FileText, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { label: "प्रगति में / In Progress", value: stats.active, icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "सत्यापित समाधान / Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "सत्यापन लंबित / Verification", value: stats.pending, icon: AlertCircle, color: "text-purple-700 bg-purple-50 border-purple-200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Official Government Welcome Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#002d62] via-[#00387a] to-blue-900 text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
        {/* Subtle Tricolor accent line at card top */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="h-full w-1/3 bg-[#FF9933]" />
          <div className="h-full w-1/3 bg-white" />
          <div className="h-full w-1/3 bg-[#138808]" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10 pt-1">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-400 text-slate-900 px-2 py-0.5 rounded">
              राष्ट्रीय नागरिक सेवा डैशबोर्ड
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight mt-1">
              नमस्ते, {profile?.full_name?.split(" ")[0] || "नागरिक (Citizen)"}
            </h1>
            <p className="text-xs text-blue-100 mt-0.5">
              Track your reported grievances in real-time or lodge a new issue with instant GPS & camera evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/dashboard/report">
              <Button size="sm" className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-xs gap-1.5 shadow-sm">
                <PlusCircle className="h-4 w-4" /> नई शिकायत दर्ज करें (Lodge Grievance)
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">{s.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-10 mt-1" />
                  ) : (
                    <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
                  )}
                </div>
                <div className={`rounded-xl p-2.5 border ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent complaints */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              हाल ही में दर्ज शिकायतें (Recent Grievances)
            </CardTitle>
            <p className="text-xs text-slate-500">Track current status of your submitted issues</p>
          </div>
          <Link href="/dashboard/complaints" className="text-xs font-bold text-blue-800 hover:text-blue-900 hover:underline">
            सभी देखें (View All)
          </Link>
        </CardHeader>
        <CardContent className="pt-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : complaints.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="कोई शिकायत दर्ज नहीं है"
              description="You have not submitted any grievances yet. Report a pothole, waste dump, or streetlight issue to get started."
              action={
                <Link href="/dashboard/report">
                  <Button variant="primary" size="sm" className="bg-[#002d62]">
                    <PlusCircle className="h-4 w-4 mr-1.5" /> शिकायत दर्ज करें (Lodge Grievance)
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <Link key={c.id} href={`/dashboard/complaints/${c.id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-3 rounded-xl transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-blue-800 font-semibold">{c.tracking_id}</span> · {formatRelativeTime(c.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={c.status} className="ml-3 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CivicPulse — Live Neighborhood Alerts */}
      <CivicPulseFeed />

      {/* Floating AI Assistant — renders portal over entire page */}
      <CitizenAIAssistant />
    </div>
  );
}
