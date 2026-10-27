"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, MapPin, Calendar, Tag, Building2, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate, getStatusLabel } from "@/lib/utils";
import type { Complaint, StatusHistoryEntry, ResolutionEvidence } from "@/types";

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [evidence, setEvidence] = useState<ResolutionEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let channel: any = null;
    const supabase = createClient();

    const fetchData = async () => {
      const { data: comp } = await supabase
        .from("complaints")
        .select("*, department:departments(*), ward:wards(*)")
        .eq("id", params.id)
        .single();
      setComplaint(comp);

      if (comp) {
        const [histRes, evRes] = await Promise.all([
          supabase.from("status_history").select("*").eq("complaint_id", comp.id).order("created_at", { ascending: true }),
          supabase.from("resolution_evidence").select("*").eq("complaint_id", comp.id).order("created_at", { ascending: false }),
        ]);
        setHistory(histRes.data || []);
        setEvidence(evRes.data || []);

        // Unique channel name per mount to prevent duplicate subscriptions
        const channelName = `complaint_channel_${comp.id}_${Date.now()}`;
        channel = supabase.channel(channelName);

        channel
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "complaints", filter: `id=eq.${comp.id}` },
            (payload: any) => {
              setComplaint((prev) => (prev ? { ...prev, ...payload.new } : null));
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "status_history", filter: `complaint_id=eq.${comp.id}` },
            (payload: any) => {
              setHistory((prev) => [...prev, payload.new as StatusHistoryEntry]);
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "resolution_evidence", filter: `complaint_id=eq.${comp.id}` },
            async () => {
              const { data: updatedEv } = await supabase
                .from("resolution_evidence")
                .select("*")
                .eq("complaint_id", comp.id)
                .order("created_at", { ascending: false });
              setEvidence(updatedEv || []);
            }
          )
          .subscribe();
      }
      setIsLoading(false);
    };

    fetchData();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [params.id]);

  if (isLoading) return <LoadingSpinner />;
  if (!complaint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-slate-900">Complaint not found</h2>
        <p className="text-sm text-slate-500 mt-1">This complaint may have been removed or you don&apos;t have access.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-slate-400">{complaint.tracking_id}</span>
          <StatusBadge status={complaint.status} />
          <Badge variant={complaint.priority === "URGENT" ? "error" : complaint.priority === "HIGH" ? "warning" : "default"}>
            {complaint.priority}
          </Badge>
        </div>
        <h1 className="text-xl font-bold text-slate-900">{complaint.title}</h1>
      </div>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{complaint.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Tag className="h-4 w-4 text-slate-400" /> {complaint.category.replace(/_/g, " ")}</div>
            <div className="flex items-center gap-2 text-slate-600"><Calendar className="h-4 w-4 text-slate-400" /> {formatDate(complaint.created_at)}</div>
            {complaint.department && (
              <div className="flex items-center gap-2 text-slate-600"><Building2 className="h-4 w-4 text-slate-400" /> {complaint.department.name}</div>
            )}
            {complaint.address && (
              <div className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /> <span className="truncate">{complaint.address}</span></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      {complaint.photo_urls && complaint.photo_urls.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Photos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {complaint.photo_urls.map((url, i) => (
                <img key={i} src={url} alt={`Complaint photo ${i + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Status Timeline</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No status updates yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-100 mt-1" />
                    {i < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.new_status} />
                      <span className="text-xs text-slate-400">{formatDate(h.created_at)}</span>
                    </div>
                    {h.notes && <p className="text-sm text-slate-600 mt-1">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution evidence */}
      {evidence.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resolution Evidence</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {evidence.map((ev) => (
              <div key={ev.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={ev.is_approved === true ? "success" : ev.is_approved === false ? "error" : "warning"}>
                    {ev.is_approved === true ? "Approved" : ev.is_approved === false ? "Rejected" : "Pending Review"}
                  </Badge>
                  <span className="text-xs text-slate-400">{formatDate(ev.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700">{ev.notes}</p>
                {ev.photo_urls && ev.photo_urls.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {ev.photo_urls.map((url, i) => (
                      <img key={i} src={url} alt={`Evidence ${i + 1}`} className="h-20 w-20 object-cover rounded-lg border" />
                    ))}
                  </div>
                )}
                {ev.review_notes && (
                  <p className="text-xs text-slate-500 mt-2 italic">Reviewer: {ev.review_notes}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
