"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, MapPin, Calendar, Tag, Building2, User, Clock,
  Star, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown, RotateCcw, Loader2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SLABadge } from "@/components/ui/sla-badge";
import { formatDate, getStatusLabel } from "@/lib/utils";
import type { Complaint, StatusHistoryEntry, ResolutionEvidence } from "@/types";

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [evidence, setEvidence] = useState<ResolutionEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Citizen sign-off state
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmittingSignOff, setIsSubmittingSignOff] = useState<boolean>(false);
  const [signOffMessage, setSignOffMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
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
    }
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    let channel: any = null;
    const supabase = createClient();

    fetchData();

    if (params.id) {
      const channelName = `complaint_channel_${params.id}_${Date.now()}`;
      channel = supabase.channel(channelName);

      channel
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "complaints", filter: `id=eq.${params.id}` },
          (payload: any) => {
            setComplaint((prev) => (prev ? { ...prev, ...payload.new } : null));
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "status_history", filter: `complaint_id=eq.${params.id}` },
          (payload: any) => {
            setHistory((prev) => [...prev, payload.new as StatusHistoryEntry]);
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "resolution_evidence", filter: `complaint_id=eq.${params.id}` },
          async () => {
            const { data: updatedEv } = await supabase
              .from("resolution_evidence")
              .select("*")
              .eq("complaint_id", params.id)
              .order("created_at", { ascending: false });
            setEvidence(updatedEv || []);
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [params.id, fetchData]);

  // Citizen sign-off actions (Confirm vs Dispute)
  const handleResolutionAction = async (action: "CONFIRM" | "DISPUTE") => {
    if (!complaint) return;
    setIsSubmittingSignOff(true);
    setSignOffMessage(null);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rating: action === "CONFIRM" ? rating : undefined,
          feedback: feedback.trim(),
          feedbackNotes: feedback.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setSignOffMessage({
        type: "success",
        text: action === "CONFIRM" 
          ? "समाधान की पुष्टि कर दी गई है। आपकी बहुमूल्य प्रतिक्रिया दर्ज हो चुकी है। (Resolution verified & closed)" 
          : "शिकायत पुनः खोली गई है और उच्च प्राथमिकता के साथ संबंधित विभाग को प्रेषित कर दी गई है। (Grievance reopened with HIGH priority)",
      });

      // Refetch updated ticket state
      await fetchData();
    } catch (err: any) {
      setSignOffMessage({
        type: "error",
        text: err.message || "अनुरोध संसाधित करने में त्रुटि।",
      });
    } finally {
      setIsSubmittingSignOff(false);
    }
  };

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

  const latestEvidence = evidence.length > 0 ? evidence[0] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4" /> वापस जाएं | Back to Complaints
      </button>

      {/* Official Government Complaint Dossier Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {complaint.tracking_id}
              </span>
              <StatusBadge status={complaint.status} />
              <Badge variant={complaint.priority === "URGENT" ? "error" : complaint.priority === "HIGH" ? "warning" : "default"} className="font-bold">
                {complaint.priority}
              </Badge>
              {/* Citizen Charter SLA Countdown Badge */}
              <SLABadge complaint={complaint} />
              {complaint.is_sensitive && (
                <span className="text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">
                  गोपनीय / SENSITIVE
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{complaint.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              पंजीकरण तिथि: {formatDate(complaint.created_at)} • MoHUA National Redressal Registry
            </p>
          </div>
        </div>
      </div>

      {/* Citizen Resolution Verification / Dispute Workflow */}
      {(complaint.status === "RESOLVED" || complaint.status === "PENDING_VERIFICATION") && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-emerald-50/40 shadow-xs relative overflow-hidden">
          <div className="h-1 w-full absolute top-0 left-0 bg-blue-600" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <CardTitle className="text-base text-slate-900">
                नागरिक समाधान सत्यापन • Citizen Resolution Sign-Off
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600">
              नगर निगम अधिकारी द्वारा कार्य पूर्ण रिपोर्ट प्रस्तुत की गई है। कृपया समाधान की पुष्टि करें अथवा असंतुष्ट होने पर पुनः खोलें।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {signOffMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  signOffMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {signOffMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{signOffMessage.text}</span>
              </div>
            )}

            {/* Before vs After Resolution Photo Inspection */}
            {latestEvidence?.photo_urls && latestEvidence.photo_urls.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  कार्य पूर्णता साक्ष्य (Before & After Resolution Comparison)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Original Complaint Photo */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">शिकायत के समय (Before)</span>
                    {complaint.photo_urls && complaint.photo_urls[0] ? (
                      <img
                        src={complaint.photo_urls[0]}
                        alt="Original Issue"
                        className="w-full h-36 object-cover rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="w-full h-36 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        मूल फोटो उपलब्ध नहीं
                      </div>
                    )}
                  </div>

                  {/* Completion Photo */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-700">समाधान के बाद (After Completion)</span>
                    <img
                      src={latestEvidence.photo_urls[0]}
                      alt="Work Completed Evidence"
                      className="w-full h-36 object-cover rounded-lg border border-emerald-300"
                    />
                  </div>
                </div>

                {latestEvidence.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                    <strong className="text-slate-700">अधिकारी की टिप्पणी:</strong> {latestEvidence.notes}
                  </p>
                )}
              </div>
            )}

            {/* Rating Stars */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                समाधान संतुष्टि रेटिंग (Satisfaction Rating):
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating ? "fill-amber-400 text-amber-500" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 ml-2">
                  {rating === 5 ? "उत्कृष्ट (5/5)" : rating === 4 ? "अच्छा (4/5)" : rating === 3 ? "संतोषजनक (3/5)" : "असंतोषजनक"}
                </span>
              </div>
            </div>

            {/* Feedback textarea */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 block">
                नागरिक टिप्पणी (Feedback / Remarks - optional):
              </label>
              <Textarea
                placeholder="टिप्पणी या कारण (वैकल्पिक / Optional)..."
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Confirm vs Dispute Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleResolutionAction("DISPUTE")}
                disabled={isSubmittingSignOff}
                className="w-full sm:w-auto text-xs text-red-600 border-red-200 bg-white hover:bg-red-50 gap-1.5"
              >
                {isSubmittingSignOff ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                असंतुष्ट - पुनः खोलें (Dispute & Reopen)
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => handleResolutionAction("CONFIRM")}
                disabled={isSubmittingSignOff}
                className="w-full sm:w-auto text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isSubmittingSignOff ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                संतुष्ट - समाधान स्वीकार करें (Confirm & Close)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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



