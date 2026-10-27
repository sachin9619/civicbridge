"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ArrowLeft, MapPin, Calendar, Tag, Camera, X, Upload,
  CheckCircle2, Play, Send, Loader2, Sparkles, AlertCircle, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/lib/utils";
import type { Complaint, StatusHistoryEntry, ResolutionEvidence } from "@/types";
import type { ResolutionVerificationResult } from "@/lib/ai/gemini";

export default function EmployeeTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [evidence, setEvidence] = useState<ResolutionEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Submit evidence state
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // AI Resolution Checker state
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [aiResult, setAiResult] = useState<ResolutionVerificationResult | null>(null);

  const fetchData = async () => {
    const supabase = createClient();
    const { data: comp } = await supabase
      .from("complaints")
      .select("*, department:departments(name)")
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
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const handleStartWork = async () => {
    if (!complaint || !profile) return;
    setIsStarting(true);
    const supabase = createClient();
    await supabase.from("complaints").update({ status: "IN_PROGRESS" }).eq("id", complaint.id);
    await supabase.from("status_history").insert({
      complaint_id: complaint.id, old_status: complaint.status,
      new_status: "IN_PROGRESS", changed_by: profile.id, notes: "Work started by field employee",
    });
    setIsStarting(false);
    await fetchData();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    if (files.length + photos.length > 4) { setError("Maximum 4 photos."); return; }
    setPhotos((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setAiResult(null);
  };

  // Run AI Pre-Verification Check
  const runAiPreVerification = async () => {
    if (!complaint) return;
    if (previews.length === 0 && !notes.trim()) {
      setError("Please add at least one completion photo or notes before running AI verification.");
      return;
    }

    setIsCheckingAI(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/verify-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: complaint.id,
          beforePhotoUrls: complaint.photo_urls || [],
          afterPhotoUrls: previews,
          employeeNotes: notes.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
      } else {
        setError("AI inspection could not be completed. You can still submit manually.");
      }
    } catch {
      setError("AI inspection request failed.");
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!complaint || !profile || !notes.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `${profile.id}/${complaint.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("resolution-photos").upload(path, photo);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("resolution-photos").getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      await supabase.from("resolution_evidence").insert({
        complaint_id: complaint.id, submitted_by: profile.id,
        photo_urls: photoUrls, notes: notes.trim(),
      });

      await supabase.from("complaints").update({ status: "PENDING_VERIFICATION" }).eq("id", complaint.id);
      await supabase.from("status_history").insert({
        complaint_id: complaint.id, old_status: complaint.status,
        new_status: "PENDING_VERIFICATION", changed_by: profile.id,
        notes: "Resolution submitted for verification",
      });

      setSuccess(true);
      setNotes("");
      setPhotos([]);
      setPreviews([]);
      setAiResult(null);
      await fetchData();
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!complaint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-slate-900">Task not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const rejectedEvidence = evidence.filter((e) => e.is_approved === false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <StatusBadge status={complaint.status} />
          <Badge variant={complaint.priority === "URGENT" ? "error" : complaint.priority === "HIGH" ? "warning" : "default"}>{complaint.priority}</Badge>
        </div>
        <h1 className="text-xl font-bold text-slate-900">{complaint.title}</h1>
        <span className="text-xs font-mono text-slate-400">{complaint.tracking_id}</span>
      </div>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Task Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{complaint.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{complaint.category.replace(/_/g, " ")}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(complaint.created_at)}</span>
            {complaint.address && <span className="flex items-center gap-1 col-span-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{complaint.address}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Original Citizen Issue Photos */}
      {complaint.photo_urls?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Original Issue Photo (BEFORE)</span>
              <Badge variant="default" className="text-[10px]">Citizen Upload</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {complaint.photo_urls.map((url, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-slate-200">
                  <img src={url} alt={`Before ${i + 1}`} className="w-full h-36 object-cover" />
                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                    BEFORE
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected feedback */}
      {rejectedEvidence.length > 0 && (
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-base text-red-700">Rejection Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {rejectedEvidence.map((ev) => (
              <div key={ev.id} className="bg-red-50 rounded-lg p-3">
                <p className="text-sm text-red-700">{ev.review_notes || "Work was not approved. Please try again."}</p>
                <p className="text-xs text-red-500 mt-1">{formatDate(ev.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {complaint.status === "ASSIGNED" && (
        <Card>
          <CardContent className="p-4">
            <Button variant="primary" className="w-full" onClick={handleStartWork} isLoading={isStarting}>
              <Play className="h-4 w-4" /> Start Work
            </Button>
          </CardContent>
        </Card>
      )}

      {complaint.status === "IN_PROGRESS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit Resolution Evidence</CardTitle>
            <CardDescription>Upload photos of the repaired/cleaned site and completion notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">Evidence submitted for review!</div>}

            <Textarea
              label="Resolution notes *"
              placeholder="e.g. Pothole filled with asphalt, rolled and leveled. Traffic restored."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setAiResult(null);
              }}
              rows={3}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Completion Photos (AFTER) *
              </label>
              <div className="flex flex-wrap gap-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-xs">
                    <img src={preview} alt={`After ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-emerald-700 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                      AFTER
                    </span>
                    <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors bg-slate-50/50"
                  >
                    <Camera className="h-5 w-5 text-slate-400" />
                    <span className="text-[10px] font-medium">Add Photo</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoSelect} />
            </div>

            {/* AI Resolution Pre-Verification Button */}
            {(previews.length > 0 || notes.trim().length > 5) && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={runAiPreVerification}
                  disabled={isCheckingAI}
                  className="w-full gap-2 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100"
                >
                  {isCheckingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-blue-600" />}
                  {isCheckingAI ? "AI Inspecting Before vs After..." : "Verify Proof with AI Before Submitting"}
                </Button>
              </div>
            )}

            {/* AI Verification Results Card */}
            {aiResult && (
              <div
                className={`p-4 rounded-xl border space-y-2.5 transition-all animate-in fade-in-0 ${
                  aiResult.verdict === "VERIFIED_RESOLVED"
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                    : "bg-amber-50/80 border-amber-200 text-amber-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {aiResult.verdict === "VERIFIED_RESOLVED" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <span>
                      AI Quality Verdict: {aiResult.verdict.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Badge
                    variant={aiResult.confidenceScore >= 80 ? "success" : "warning"}
                    className="text-[10px]"
                  >
                    {aiResult.confidenceScore}% Confidence
                  </Badge>
                </div>

                <p className="text-xs leading-relaxed text-slate-700">{aiResult.summary}</p>

                {aiResult.keyObservations?.length > 0 && (
                  <ul className="text-xs space-y-1 list-disc pl-4 text-slate-600">
                    {aiResult.keyObservations.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                )}

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span>Audited by: {aiResult.aiEngine}</span>
                  <span className="font-medium text-emerald-700">Recommendation: {aiResult.recommendation}</span>
                </div>
              </div>
            )}

            <Button
              variant="success"
              className="w-full gap-2 shadow-sm"
              onClick={handleSubmitEvidence}
              isLoading={isSubmitting}
              disabled={!notes.trim()}
            >
              <Send className="h-4 w-4" /> Submit for Verification
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50 mt-1.5" />
                  {i < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                </div>
                <div className="pb-3">
                  <StatusBadge status={h.new_status} />
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(h.created_at)}</p>
                  {h.notes && <p className="text-xs text-slate-600 mt-0.5">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
