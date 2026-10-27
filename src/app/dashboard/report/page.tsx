"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera, MapPin, Upload, X, CheckCircle2, Loader2, AlertTriangle,
  ImageIcon, Sparkles, ExternalLink, ArrowRight, ShieldAlert,
} from "lucide-react";
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
import type { DuplicateDetectionResult } from "@/lib/ai/gemini";

export default function ReportIssuePage() {
  const router = useRouter();
  const { profile } = useAuth();
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

  // Actual Complaint Submission to Supabase
  const executeSubmission = async (data: ComplaintFormData) => {
    if (!profile) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const trackingId = generateTrackingId();
      const isSensitive = data.category === "WOMEN_SAFETY";

      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `${profile.id}/${trackingId}/${Date.now()}.${ext}`;
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

      const { error: insertError } = await supabase.from("complaints").insert({
        tracking_id: trackingId,
        title: data.title,
        description: data.description,
        category: data.category,
        status: "SUBMITTED",
        priority: isSensitive ? "HIGH" : "MEDIUM",
        reporter_id: profile.id,
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
          changed_by: profile.id,
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
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Complaint Submitted!</h2>
            <p className="text-sm text-slate-500 mb-4">Your complaint has been recorded and will be reviewed shortly.</p>
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-slate-500 mb-1">Tracking Reference</p>
              <p className="text-lg font-mono font-bold text-blue-600">{success.trackingId}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="primary" onClick={() => router.push("/dashboard/complaints")} className="w-full">
                View My Complaints
              </Button>
              <Button variant="outline" onClick={() => { setSuccess(null); setPhotos([]); setPreviews([]); setDuplicateResult(null); }} className="w-full">
                Report Another Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Report a Civic Issue</h1>
        <p className="text-sm text-slate-500 mt-0.5">Provide details about the issue you&apos;d like to report</p>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Issue Details</CardTitle>
              <CardDescription>Describe what you observed</CardDescription>
            </div>
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
              {isScanningDuplicates ? "Scanning..." : "Scan for Duplicates with AI"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Title" placeholder="e.g. Broken streetlight on MG Road" error={errors.title?.message} {...register("title")} />
            <Textarea label="Description" placeholder="Describe the issue in detail — what, where, and how it affects you..." rows={4} error={errors.description?.message} {...register("description")} />
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
