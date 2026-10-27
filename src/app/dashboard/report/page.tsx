"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera, MapPin, Upload, X, CheckCircle2, Loader2, AlertTriangle,
  ImageIcon, Sparkles, ExternalLink, ArrowRight, ShieldAlert,
  BrainCircuit, Clock, Bot, Check,
} from "lucide-react";
import { calculateSLADeadline } from "@/lib/sla";
import { complaintSchema, type ComplaintFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { generateTrackingId, getDepartmentForCategory, lookupWardFromCoordinates } from "@/lib/utils";
import { COMPLAINT_CATEGORIES } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LiveCameraModal } from "@/components/ui/live-camera-modal";
import { VoiceGrievanceRecorder } from "@/components/ui/voice-grievance-recorder";
import type { DuplicateDetectionResult } from "@/lib/ai/gemini";

export default function ReportIssuePage() {
  const router = useRouter();
  const { profile, user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ trackingId: string } | null>(null);

  // AI Duplicate Detection state
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateDetectionResult | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ComplaintFormData | null>(null);

  // AI Auto-Triage Suggestion state
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    category: string;
    department: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    confidence: number;
    reasoning: string[];
    slaHours: number;
  } | null>(null);
  const [chosenPriority, setChosenPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [isTriageApplied, setIsTriageApplied] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { latitude: null, longitude: null, address: null },
  });

  const selectedCategory = watch("category");
  const watchTitle = watch("title");
  const watchDescription = watch("description");
  const lat = watch("latitude");
  const lng = watch("longitude");

  const addPhotoFile = (file: File) => {
    if (photos.length >= 4) {
      setError("Maximum 4 photos allowed.");
      return;
    }
    setPhotos((prev) => [...prev, file]);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string]);
    reader.readAsDataURL(file);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return false;
      if (f.size > 5 * 1024 * 1024) return false;
      return true;
    });
    if (valid.length + photos.length > 4) {
      setError("Maximum 4 photos allowed.");
      return;
    }
    valid.forEach((f) => addPhotoFile(f));
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        // Try reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          if (data.display_name) setValue("address", data.display_name);
        } catch {
          // Geocoding is best-effort
        }
        setIsLocating(false);
      },
      () => {
        setError("Could not get your location. You can enter it manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // AI Duplicate Check Function
  const runDuplicateScan = async (titleVal: string, descVal: string, catVal: string, manualTrigger = false) => {
    if (!titleVal || !catVal) {
      if (manualTrigger) setError("Please enter an Issue Title and Category first.");
      return null;
    }

    setIsScanningDuplicates(true);
    try {
      const res = await fetch("/api/ai/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleVal,
          description: descVal || "",
          category: catVal,
          latitude: lat || null,
          longitude: lng || null,
        }),
      });

      if (res.ok) {
        const data: DuplicateDetectionResult = await res.json();
        setDuplicateResult(data);
        if (data.hasDuplicates) {
          setIsDuplicateDialogOpen(true);
          return data;
        } else if (manualTrigger) {
          setError(null);
        }
        return data;
      }
    } catch (e) {
      console.warn("AI Duplicate check failed:", e);
    } finally {
      setIsScanningDuplicates(false);
    }
    return null;
  };

  // AI Auto-Triage Suggestion Function
  const handleGetAISuggestions = async () => {
    if (!watchDescription && !watchTitle) {
      setError("कृपया पहले समस्या का विवरण या शीर्षक लिखें (Please enter a title or description first).");
      return;
    }
    setIsSuggesting(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: watchTitle || "",
          description: watchDescription || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data);
        setIsTriageApplied(false);
      } else {
        setError("AI सेवा अस्थायी रूप से अनुपलब्ध है। आप मैन्युअल रूप से श्रेणी चुन सकते हैं।");
      }
    } catch {
      setError("AI सेवा से संपर्क करने में असमर्थ। आप मैन्युअल रूप से जारी रख सकते हैं।");
    } finally {
      setIsSuggesting(false);
    }
  };

  const applyAISuggestions = () => {
    if (!aiSuggestion) return;
    setValue("category", aiSuggestion.category as any);
    setChosenPriority(aiSuggestion.priority);
    setIsTriageApplied(true);
  };

  // Actual Complaint Submission to Supabase
  const executeSubmission = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    let reporterId = profile?.id || user?.id;

    if (!reporterId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        reporterId = authData.user?.id;
      } catch {
        // Ignore
      }
    }

    if (!reporterId) {
      setIsSubmitting(false);
      router.push("/login?redirect=/dashboard/report");
      return;
    }

    try {
      const trackingId = generateTrackingId();
      const isSensitive = data.category === "WOMEN_SAFETY";

      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `${reporterId}/${trackingId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("complaint-photos")
          .upload(path, photo);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("complaint-photos")
            .getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      const { data: deptData } = await supabase
        .from("departments")
        .select("id")
        .eq("name", getDepartmentForCategory(data.category))
        .maybeSingle();

      // Check if suggested ward exists in DB
      let assignedWardId: string | null = null;
      const suggestedWardId = lookupWardFromCoordinates(data.latitude, data.longitude);
      const { data: wardExists } = await supabase
        .from("wards")
        .select("id")
        .eq("id", suggestedWardId)
        .maybeSingle();

      if (wardExists) {
        assignedWardId = wardExists.id;
      }

      const effectivePriority = isSensitive ? "HIGH" : (chosenPriority || "MEDIUM");
      const deadlineDate = calculateSLADeadline(data.category, effectivePriority);

      const { error: insertError } = await supabase.from("complaints").insert({
        tracking_id: trackingId,
        title: data.title,
        description: data.description,
        category: data.category,
        status: "SUBMITTED",
        priority: effectivePriority,
        deadline: deadlineDate.toISOString(),
        reporter_id: reporterId,
        department_id: deptData?.id || null,
        ward_id: assignedWardId,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        photo_urls: photoUrls,
        is_sensitive: isSensitive,
      });

      if (insertError) throw insertError;

      // Insert initial status history
      const { data: complaint } = await supabase
        .from("complaints")
        .select("id")
        .eq("tracking_id", trackingId)
        .single();

      if (complaint) {
        await supabase.from("status_history").insert({
          complaint_id: complaint.id,
          new_status: "SUBMITTED",
          changed_by: reporterId,
          notes: "Complaint submitted by citizen",
        }).select();
      }

      setSuccess({ trackingId });
    } catch (err: any) {
      console.error("Submission error details:", err);
      setError(err?.message || err?.error_description || "Failed to submit complaint. Please check fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Submit Handler with AI Deduplication Check
  const onSubmit = async (data: ComplaintFormData) => {
    // If not checked yet, do a quick duplicate scan first
    if (!duplicateResult) {
      const scan = await runDuplicateScan(data.title, data.description, data.category, false);
      if (scan && scan.hasDuplicates) {
        setPendingFormData(data);
        return; // Pause submit to show duplicate alert dialog
      }
    }
    await executeSubmission(data);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-slate-200 bg-white shadow-md relative overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-2">
              भारत सरकार • आधिकारिक शिकायत पावती
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">शिकायत सफलतापूर्वक दर्ज की गई</h2>
            <p className="text-sm font-medium text-slate-700 mb-1">Grievance Registered Successfully</p>
            <p className="text-xs text-slate-500 mb-6">Your civic grievance has been logged into the national registry and dispatched to the designated municipal authority.</p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                <span className="text-xs font-medium text-slate-500">पावती / Tracking ID</span>
                <span className="text-[11px] font-bold text-[#046A38] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">256-Bit SSL Logged</span>
              </div>
              <p className="text-xl font-mono font-bold text-[#002B49] text-center py-1">{success.trackingId}</p>
              <p className="text-[11px] text-slate-500 text-center mt-1">Please save this tracking ID for SMS / WhatsApp status updates.</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button variant="primary" onClick={() => router.push("/dashboard/complaints")} className="w-full bg-[#002B49] hover:bg-[#00385f]">
                मेरी शिकायतें देखें | View My Complaints
              </Button>
              <Button variant="outline" onClick={() => { setSuccess(null); setPhotos([]); setPreviews([]); setDuplicateResult(null); }} className="w-full">
                एक और शिकायत दर्ज करें | Report Another Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Official Government Grievance Form Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider text-[#d32f2f] uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                प्रपत्र - सी.बी. 01 • FORM CB-01
              </span>
              <span className="text-[11px] font-medium text-slate-500">नागरिक अधिकार पत्र • Citizen Charter</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              नागरिक शिकायत पंजीकरण प्रपत्र <span className="text-slate-400 font-normal">|</span> File a Grievance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              शहरी शासन और सार्वजनिक सुविधाओं के त्वरित समाधान हेतु राष्ट्रीय पोर्टल
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-semibold text-slate-600 block">हेल्पलाइन: 1800-11-2026</span>
            <span className="text-[10px] text-slate-400">Toll Free 24x7 Support</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* AI Duplicate Detection Inline Notification */}
      {duplicateResult && !duplicateResult.hasDuplicates && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
          <span><strong>AI Scan Clean:</strong> No matching duplicate complaints found nearby. Your issue is unique.</span>
        </div>
      )}

      {/* Voice-First Grievance Assistant (USP Feature) */}
      <VoiceGrievanceRecorder
        onTranscriptProcessed={({ title, description, category }) => {
          setValue("title", title);
          setValue("description", description);
          if (category) {
            setValue("category", category);
          }
        }}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issue Category</CardTitle>
            <CardDescription>Select the type of issue you&apos;re reporting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMPLAINT_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                    selectedCategory === cat.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input type="radio" value={cat.value} className="sr-only" {...register("category")} />
                  <span className="text-xs font-medium text-slate-700 leading-tight">{cat.label}</span>
                </label>
              ))}
            </div>
            {errors.category && <p className="text-xs text-red-600 mt-2">{errors.category.message}</p>}
            {selectedCategory === "WOMEN_SAFETY" && (
              <div className="mt-3 rounded-lg bg-pink-50 border border-pink-200 px-3 py-2 text-xs text-pink-700">
                <strong>Confidentiality notice:</strong> This report will be handled with strict privacy. Only authorized personnel will have access.
                For immediate danger, please contact emergency services (112).
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Issue Details</CardTitle>
              <CardDescription>Describe what you observed</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* AI Auto-Triage Suggestion Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetAISuggestions}
                disabled={isSuggesting || (!watchTitle && !watchDescription)}
                className="text-xs gap-1.5 text-purple-700 border-purple-200 bg-purple-50/60 hover:bg-purple-100"
              >
                {isSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BrainCircuit className="h-3.5 w-3.5 text-purple-600" />}
                {isSuggesting ? "Analyzing with AI..." : "AI Auto-Triage (एआई सुझाव)"}
              </Button>

              {/* AI Duplicate Scanner Quick Trigger Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => runDuplicateScan(watchTitle, watchDescription, selectedCategory, true)}
                disabled={isScanningDuplicates || !watchTitle || !selectedCategory}
                className="text-xs gap-1.5 text-blue-700 border-blue-200 bg-blue-50/60 hover:bg-blue-100"
              >
                {isScanningDuplicates ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-blue-600" />}
                {isScanningDuplicates ? "Scanning..." : "Scan for Duplicates"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Title" placeholder="e.g. Broken streetlight on MG Road" error={errors.title?.message} {...register("title")} />
            <Textarea label="Description" placeholder="Describe the issue in detail — what, where, and how it affects you..." rows={4} error={errors.description?.message} {...register("description")} />

            {/* AI Auto-Triage Recommendation Card */}
            {aiSuggestion && (
              <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow-xs">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                      AI Triage Recommendation • बुद्धिमत्ता विश्लेषण
                    </span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[11px] font-semibold">
                    {Math.round(aiSuggestion.confidence * 100)}% Confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase block">Recommended Category</span>
                    <span className="font-bold text-purple-900">{aiSuggestion.category.replace(/_/g, " ")}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase block">Department</span>
                    <span className="font-bold text-slate-800">{aiSuggestion.department}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase block">Priority & SLA</span>
                    <span className="font-bold text-amber-700 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {aiSuggestion.priority} · {aiSuggestion.slaHours}h Target
                    </span>
                  </div>
                </div>

                {aiSuggestion.reasoning && aiSuggestion.reasoning.length > 0 && (
                  <div className="text-xs text-slate-600 bg-white/70 rounded-lg p-2.5 border border-purple-100">
                    <p className="font-semibold text-slate-700 mb-1">कारण व विश्लेषण (Analysis & Rationale):</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                      {aiSuggestion.reasoning.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-slate-500">
                    {isTriageApplied
                      ? "✓ श्रेणी और प्राथमिकता लागू कर दी गई है।"
                      : "अनुशंसा लागू करने के लिए नीचे दिए बटन पर क्लिक करें।"}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAiSuggestion(null)}
                      className="h-7 text-xs text-slate-500 hover:text-slate-700"
                    >
                      खारिज करें (Dismiss)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyAISuggestions}
                      disabled={isTriageApplied}
                      className={`h-7 text-xs gap-1 font-semibold ${
                        isTriageApplied
                          ? "bg-emerald-600 text-white cursor-default"
                          : "bg-purple-700 hover:bg-purple-800 text-white"
                      }`}
                    >
                      {isTriageApplied ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                      {isTriageApplied ? "लागू कर दिया गया (Applied)" : "सुझाव लागू करें (Accept AI)"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos & Live Camera</CardTitle>
            <CardDescription>Click live photo or upload from device (max 4 photos, 5 MB each)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-xs">
                  <img src={preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}

              {photos.length < 4 && (
                <div className="flex gap-2.5">
                  {/* Live Camera Button */}
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 flex flex-col items-center justify-center gap-1.5 text-blue-600 hover:bg-blue-100/60 hover:border-blue-500 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Camera className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-semibold">Live Camera</span>
                  </button>

                  {/* Device Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-medium">Upload File</span>
                  </button>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoSelect} className="hidden" />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
            <CardDescription>Help officials locate the issue accurately</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="outline" onClick={requestLocation} disabled={isLocating} className="w-full">
              {isLocating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
              {isLocating ? "Detecting Location..." : "Use Current GPS Location"}
            </Button>
            {lat && lng && (
              <p className="text-xs text-slate-500 font-mono">
                Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            )}
            <Input label="Address / Landmark" placeholder="Street address, nearest landmark, area name" {...register("address")} />
          </CardContent>
        </Card>

        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} className="w-full shadow-sm">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Complaint"}
        </Button>
      </form>

      {/* Live Camera Modal */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => {
          addPhotoFile(file);
          setIsCameraOpen(false);
        }}
      />

      {/* AI Duplicate Detected Dialog */}
      <Dialog
        open={isDuplicateDialogOpen}
        onClose={() => setIsDuplicateDialogOpen(false)}
        className="max-w-lg"
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-amber-950 flex items-center gap-2">
                Similar Complaint Found Nearby
                <Badge variant="warning" className="text-[10px]">
                  {duplicateResult?.primaryMatch?.similarityScore || 85}% Match
                </Badge>
              </DialogTitle>
              <DialogDescription>
                CivicBridge AI detected an active ticket that may refer to the same issue.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {duplicateResult?.primaryMatch && (
          <div className="space-y-3 py-2 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-blue-600">
                  {duplicateResult.primaryMatch.trackingId}
                </span>
                <Badge variant="default" className="text-[10px] capitalize">
                  {duplicateResult.primaryMatch.status.toLowerCase().replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="font-semibold text-slate-900">{duplicateResult.primaryMatch.title}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                {duplicateResult.primaryMatch.distanceMeters < 99999 && (
                  <span className="flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    <MapPin className="h-3 w-3" />
                    {duplicateResult.primaryMatch.distanceMeters}m away
                  </span>
                )}
                <span>{duplicateResult.primaryMatch.reason}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Subscribing or tracking the existing ticket helps municipal workers resolve issues faster without duplicate work orders.
            </p>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDuplicateDialogOpen(false);
                  if (pendingFormData) {
                    executeSubmission(pendingFormData);
                  }
                }}
                className="w-full sm:w-auto"
              >
                Submit as New Complaint Anyway
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  router.push(`/dashboard/complaints/${duplicateResult.primaryMatch?.complaintId}`);
                }}
                className="w-full sm:w-auto gap-1.5"
              >
                View Existing Ticket
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
