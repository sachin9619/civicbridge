"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ArrowLeft, MapPin, Calendar, Tag, Building2, User, Clock,
  UserCheck, CheckCircle2, XCircle, Send, AlertTriangle, Sparkles,
  ExternalLink, Loader2, ArrowRight, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDate, getStatusLabel, getDepartmentForCategory } from "@/lib/utils";
import { STATUS_TRANSITIONS } from "@/types";
import type { Complaint, StatusHistoryEntry, ResolutionEvidence, ComplaintStatus, Department, Profile as ProfileType } from "@/types";
import type { DuplicateDetectionResult, ResolutionVerificationResult } from "@/lib/ai/gemini";

export default function AdminComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [evidence, setEvidence] = useState<ResolutionEvidence[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<ProfileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Assignment state
  const [showAssign, setShowAssign] = useState(false);
  const [assignDept, setAssignDept] = useState("");
  const [assignEmployee, setAssignEmployee] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignDeadline, setAssignDeadline] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Status change state
  const [statusNotes, setStatusNotes] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Evidence review state
  const [reviewingEvidence, setReviewingEvidence] = useState<ResolutionEvidence | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // AI Duplicate Detection state
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [duplicateScanResult, setDuplicateScanResult] = useState<DuplicateDetectionResult | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // AI Evidence Verification state
  const [aiAudits, setAiAudits] = useState<Record<string, ResolutionVerificationResult>>({});
  const [auditingEvidenceId, setAuditingEvidenceId] = useState<string | null>(null);

  const fetchData = async () => {
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

    const [deptRes, empRes] = await Promise.all([
      supabase.from("departments").select("*").eq("is_active", true).order("name"),
      supabase.from("profiles").select("*").eq("role", "employee").order("full_name"),
    ]);
    setDepartments(deptRes.data || []);
    setEmployees(empRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const handleAssign = async () => {
    if (!complaint || !profile || !assignEmployee || !assignDept) return;
    setIsAssigning(true);
    const supabase = createClient();

    // Deactivate old assignments
    await supabase.from("assignments").update({ is_active: false }).eq("complaint_id", complaint.id);

    // Create assignment
    await supabase.from("assignments").insert({
      complaint_id: complaint.id,
      assigned_to: assignEmployee,
      assigned_by: profile.id,
      department_id: assignDept,
      notes: assignNotes || null,
      deadline: assignDeadline || null,
    });

    // Update complaint
    await supabase.from("complaints").update({
      department_id: assignDept,
      assigned_employee_id: assignEmployee,
      status: "ASSIGNED",
      deadline: assignDeadline || null,
    }).eq("id", complaint.id);

    // Add status history
    await supabase.from("status_history").insert({
      complaint_id: complaint.id,
      old_status: complaint.status,
      new_status: "ASSIGNED",
      changed_by: profile.id,
      notes: `Assigned to employee with deadline ${assignDeadline || "none"}`,
    });

    setShowAssign(false);
    setIsAssigning(false);
    await fetchData();
  };

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (!complaint || !profile) return;
    setIsChangingStatus(true);
    const supabase = createClient();

    const updateData: Record<string, any> = { status: newStatus };
    if (newStatus === "RESOLVED") updateData.resolved_at = new Date().toISOString();

    await supabase.from("complaints").update(updateData).eq("id", complaint.id);
    await supabase.from("status_history").insert({
      complaint_id: complaint.id,
      old_status: complaint.status,
      new_status: newStatus,
      changed_by: profile.id,
      notes: statusNotes || null,
    });

    setStatusNotes("");
    setIsChangingStatus(false);
    await fetchData();
  };

  const handleReviewEvidence = async (approved: boolean, customNotes?: string) => {
    if (!reviewingEvidence || !complaint || !profile) return;
    setIsReviewing(true);
    const supabase = createClient();

    const notesToSave = customNotes || reviewNotes;

    // Update evidence
    await supabase.from("resolution_evidence").update({
      is_approved: approved,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notesToSave || null,
    }).eq("id", reviewingEvidence.id);

    // If approved -> RESOLVED, else -> IN_PROGRESS
    const newStatus = approved ? "RESOLVED" : "IN_PROGRESS";
    const updateData: Record<string, any> = { status: newStatus };
    if (approved) updateData.resolved_at = new Date().toISOString();

    await supabase.from("complaints").update(updateData).eq("id", complaint.id);
    await supabase.from("status_history").insert({
      complaint_id: complaint.id,
      old_status: complaint.status,
      new_status: newStatus,
      changed_by: profile.id,
      notes: approved ? `Resolution approved: ${notesToSave || "Verified"}` : `Resolution rejected: ${notesToSave || "Needs more work"}`,
    });

    setReviewingEvidence(null);
    setReviewNotes("");
    setIsReviewing(false);
    await fetchData();
  };

  // Run AI Duplicate Scanner
  const handleScanDuplicates = async () => {
    if (!complaint) return;
    setIsScanningDuplicates(true);
    try {
      const res = await fetch("/api/ai/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: complaint.title,
          description: complaint.description,
          category: complaint.category,
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          excludeId: complaint.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDuplicateScanResult(data);
        setShowDuplicateDialog(true);
      }
    } catch (err) {
      console.warn("AI Duplicate scan failed:", err);
    } finally {
      setIsScanningDuplicates(false);
    }
  };

  // Run AI Resolution Evidence Audit
  const handleAuditEvidence = async (ev: ResolutionEvidence) => {
    if (!complaint) return;
    setAuditingEvidenceId(ev.id);
    try {
      const res = await fetch("/api/ai/verify-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: complaint.id,
          beforePhotoUrls: complaint.photo_urls || [],
          afterPhotoUrls: ev.photo_urls || [],
          employeeNotes: ev.notes || "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAudits((prev) => ({ ...prev, [ev.id]: data }));
      }
    } catch (err) {
      console.warn("AI evidence audit failed:", err);
    } finally {
      setAuditingEvidenceId(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!complaint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-slate-900">Complaint not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[complaint.status as ComplaintStatus] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to complaints
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono text-slate-400">{complaint.tracking_id}</span>
            <StatusBadge status={complaint.status} />
            <Badge variant={complaint.priority === "URGENT" ? "error" : complaint.priority === "HIGH" ? "warning" : "default"}>{complaint.priority}</Badge>
            {complaint.is_sensitive && <Badge variant="error">SENSITIVE</Badge>}
          </div>
          <h1 className="text-xl font-bold text-slate-900">{complaint.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* AI Duplicate Scanner Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanDuplicates}
            disabled={isScanningDuplicates}
            className="gap-1.5 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100"
          >
            {isScanningDuplicates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-blue-600" />}
            AI Duplicate Scanner
          </Button>

          <Button variant="primary" size="sm" onClick={() => { setAssignDept(complaint.department_id || ""); setShowAssign(true); }}>
            <UserCheck className="h-4 w-4" /> {complaint.assigned_employee_id ? "Reassign" : "Assign"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{complaint.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Tag className="h-4 w-4 text-slate-400" /> {complaint.category.replace(/_/g, " ")}</div>
                <div className="flex items-center gap-2 text-slate-600"><Calendar className="h-4 w-4 text-slate-400" /> {formatDate(complaint.created_at)}</div>
                {complaint.department && <div className="flex items-center gap-2 text-slate-600"><Building2 className="h-4 w-4 text-slate-400" /> {(complaint.department as any).name}</div>}
                {complaint.address && <div className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /> <span className="truncate">{complaint.address}</span></div>}
                {complaint.deadline && <div className="flex items-center gap-2 text-slate-600"><Clock className="h-4 w-4 text-slate-400" /> Deadline: {formatDate(complaint.deadline)}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Original Complaint Photos */}
          {complaint.photo_urls?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Complaint Photos (BEFORE)</span>
                  <Badge variant="default" className="text-[10px]">Citizen Evidence</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.photo_urls.map((url, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border border-slate-200">
                      <img src={url} alt={`Before ${i + 1}`} className="w-full h-32 object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        BEFORE
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolution Evidence with AI Inspector */}
          {evidence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Resolution Evidence (AFTER)</span>
                  <Badge variant="primary" className="text-[10px]">Field Staff Submission</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {evidence.map((ev) => {
                  const audit = aiAudits[ev.id];
                  const isAuditing = auditingEvidenceId === ev.id;

                  return (
                    <div key={ev.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={ev.is_approved === true ? "success" : ev.is_approved === false ? "error" : "warning"}>
                            {ev.is_approved === true ? "Approved" : ev.is_approved === false ? "Rejected" : "Pending Review"}
                          </Badge>
                          <span className="text-xs text-slate-400">{formatDate(ev.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAuditEvidence(ev)}
                            disabled={isAuditing}
                            className="gap-1 text-xs text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100"
                          >
                            {isAuditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-blue-600" />}
                            {audit ? "Re-Audit with AI" : "AI Evidence Audit"}
                          </Button>
                          {ev.is_approved === null && (
                            <Button size="sm" variant="outline" onClick={() => setReviewingEvidence(ev)}>
                              Review
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {ev.notes}
                      </p>

                      {ev.photo_urls?.length > 0 && (
                        <div className="flex gap-2">
                          {ev.photo_urls.map((url, i) => (
                            <div key={i} className="relative rounded-lg overflow-hidden border">
                              <img src={url} alt={`Evidence ${i + 1}`} className="h-20 w-24 object-cover" />
                              <span className="absolute bottom-1 left-1 bg-emerald-700 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                                AFTER
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Verification Results Box */}
                      {audit && (
                        <div className={`p-3.5 rounded-lg border text-xs space-y-2 animate-in fade-in-0 ${
                          audit.verdict === "VERIFIED_RESOLVED"
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                            : "bg-amber-50/80 border-amber-200 text-amber-950"
                        }`}>
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                              AI Audit Verdict: {audit.verdict.replace(/_/g, " ")}
                            </span>
                            <Badge variant={audit.confidenceScore >= 80 ? "success" : "warning"} className="text-[10px]">
                              {audit.confidenceScore}% Confidence
                            </Badge>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{audit.summary}</p>
                          {audit.keyObservations?.length > 0 && (
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                              {audit.keyObservations.map((obs, idx) => (
                                <li key={idx}>{obs}</li>
                              ))}
                            </ul>
                          )}
                          {ev.is_approved === null && (
                            <div className="pt-1 flex justify-end">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => {
                                  setReviewingEvidence(ev);
                                  handleReviewEvidence(true, `Approved based on AI audit (${audit.confidenceScore}% confidence). ${audit.summary}`);
                                }}
                                className="text-xs gap-1.5 h-8"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Accept AI & One-Click Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Add notes for status change..." value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} rows={2} />
              <div className="flex flex-wrap gap-2">
                {allowedTransitions.map((s) => (
                  <Button key={s} size="sm"
                    variant={s === "RESOLVED" ? "success" : s === "REJECTED" ? "destructive" : "outline"}
                    onClick={() => handleStatusChange(s)} isLoading={isChangingStatus}>
                    {getStatusLabel(s)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? <p className="text-sm text-slate-500">No updates.</p> : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Duplicate Scanner Dialog */}
      <Dialog open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)} className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>AI Duplicate Complaint Scanner</DialogTitle>
              <DialogDescription>
                Deep semantic & proximity scan across active municipal tickets.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {duplicateScanResult && duplicateScanResult.potentialDuplicates.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-1">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
              <p className="font-semibold">No Duplicates Found</p>
              <p className="text-xs text-emerald-600">
                This complaint is unique in category, coordinates, and description across the city.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Found {duplicateScanResult?.potentialDuplicates.length} Potential Match{(duplicateScanResult?.potentialDuplicates.length || 0) > 1 ? "es" : ""}:
              </p>
              {duplicateScanResult?.potentialDuplicates.map((dup) => (
                <div key={dup.complaintId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-blue-600">{dup.trackingId}</span>
                    <Badge variant={dup.similarityScore >= 75 ? "error" : "warning"} className="text-[10px]">
                      {dup.similarityScore}% Similarity
                    </Badge>
                  </div>
                  <p className="font-semibold text-slate-900">{dup.title}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-amber-700">
                      <MapPin className="h-3 w-3" />
                      {dup.distanceMeters < 99999 ? `${dup.distanceMeters}m away` : "City-wide"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() => router.push(`/admin/complaints/${dup.complaintId}`)}
                    >
                      Inspect Ticket <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200/80">
                    {dup.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
            Close Scanner
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={showAssign} onClose={() => setShowAssign(false)}>
        <DialogHeader>
          <DialogTitle>Assign Complaint</DialogTitle>
          <DialogDescription>Select a department and employee to handle this complaint.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Department</label>
            <select value={assignDept} onChange={(e) => setAssignDept(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Assign To Employee</label>
              <span className="text-xs text-slate-400">
                {employees.length} employee{employees.length !== 1 ? "s" : ""} registered
              </span>
            </div>
            <select
              value={assignEmployee}
              onChange={(e) => {
                const empId = e.target.value;
                setAssignEmployee(empId);
                const selectedEmp = employees.find((emp) => emp.id === empId);
                if (selectedEmp?.department_id && !assignDept) {
                  setAssignDept(selectedEmp.department_id);
                }
              }}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name || e.email} {e.department_id ? `(${departments.find((d) => d.id === e.department_id)?.name || "Assigned"})` : "(General Pool)"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Deadline (optional)</label>
            <input type="datetime-local" value={assignDeadline} onChange={(e) => setAssignDeadline(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <Textarea label="Notes (optional)" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAssign} isLoading={isAssigning} disabled={!assignEmployee || !assignDept}>Assign</Button>
        </DialogFooter>
      </Dialog>

      {/* Review evidence dialog */}
      <Dialog open={!!reviewingEvidence} onClose={() => setReviewingEvidence(null)}>
        <DialogHeader>
          <DialogTitle>Review Resolution Evidence</DialogTitle>
          <DialogDescription>Approve or reject the submitted work.</DialogDescription>
        </DialogHeader>
        {reviewingEvidence && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-700">{reviewingEvidence.notes}</p>
              {reviewingEvidence.photo_urls?.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {reviewingEvidence.photo_urls.map((url, i) => (
                    <img key={i} src={url} alt={`Evidence ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border" />
                  ))}
                </div>
              )}
            </div>
            <Textarea label="Review notes" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Add your review notes..." rows={2} />
          </div>
        )}
        <DialogFooter>
          <Button variant="destructive" onClick={() => handleReviewEvidence(false)} isLoading={isReviewing}>
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button variant="success" onClick={() => handleReviewEvidence(true)} isLoading={isReviewing}>
            <CheckCircle2 className="h-4 w-4" /> Approve
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
