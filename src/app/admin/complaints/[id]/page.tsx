"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ArrowLeft, MapPin, Calendar, Tag, Building2, User, Clock,
  UserCheck, CheckCircle2, XCircle, Send, AlertTriangle,
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
      supabase.from("departments").select("*").eq("is_active", true),
      supabase.from("profiles").select("*").eq("role", "employee").eq("is_active", true),
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
      status: "ASSIGNED",
      department_id: assignDept,
      assigned_employee_id: assignEmployee,
      deadline: assignDeadline || null,
    }).eq("id", complaint.id);

    // Status history
    await supabase.from("status_history").insert({
      complaint_id: complaint.id,
      old_status: complaint.status,
      new_status: "ASSIGNED",
      changed_by: profile.id,
      notes: assignNotes || "Complaint assigned to employee",
    });

    // Audit log
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      action: "COMPLAINT_ASSIGNED",
      entity_type: "complaint",
      entity_id: complaint.id,
      metadata: { employee_id: assignEmployee, department_id: assignDept },
    });

    setShowAssign(false);
    setAssignNotes("");
    setAssignEmployee("");
    setIsAssigning(false);
    await fetchData();
  };

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (!complaint || !profile) return;
    setIsChangingStatus(true);
    const supabase = createClient();

    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "RESOLVED") updates.resolved_at = new Date().toISOString();

    await supabase.from("complaints").update(updates).eq("id", complaint.id);
    await supabase.from("status_history").insert({
      complaint_id: complaint.id,
      old_status: complaint.status,
      new_status: newStatus,
      changed_by: profile.id,
      notes: statusNotes || `Status changed to ${getStatusLabel(newStatus)}`,
    });
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      action: "STATUS_CHANGED",
      entity_type: "complaint",
      entity_id: complaint.id,
      metadata: { old_status: complaint.status, new_status: newStatus },
    });

    setStatusNotes("");
    setIsChangingStatus(false);
    await fetchData();
  };

  const handleReviewEvidence = async (approved: boolean) => {
    if (!reviewingEvidence || !profile || !complaint) return;
    setIsReviewing(true);
    const supabase = createClient();

    await supabase.from("resolution_evidence").update({
      is_approved: approved,
      reviewer_id: profile.id,
      review_notes: reviewNotes || null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", reviewingEvidence.id);

    const newStatus: ComplaintStatus = approved ? "RESOLVED" : "IN_PROGRESS";
    await supabase.from("complaints").update({
      status: newStatus,
      ...(approved ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", complaint.id);

    await supabase.from("status_history").insert({
      complaint_id: complaint.id,
      old_status: complaint.status,
      new_status: newStatus,
      changed_by: profile.id,
      notes: approved ? `Resolution approved: ${reviewNotes || "Verified"}` : `Resolution rejected: ${reviewNotes || "Needs more work"}`,
    });

    setReviewingEvidence(null);
    setReviewNotes("");
    setIsReviewing(false);
    await fetchData();
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

          {/* Photos */}
          {complaint.photo_urls?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Complaint Photos</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.photo_urls.map((url, i) => (
                    <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolution evidence */}
          {evidence.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Resolution Evidence</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {evidence.map((ev) => (
                  <div key={ev.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={ev.is_approved === true ? "success" : ev.is_approved === false ? "error" : "warning"}>
                          {ev.is_approved === true ? "Approved" : ev.is_approved === false ? "Rejected" : "Pending Review"}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatDate(ev.created_at)}</span>
                      </div>
                      {ev.is_approved === null && (
                        <Button size="sm" variant="outline" onClick={() => setReviewingEvidence(ev)}>Review</Button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{ev.notes}</p>
                    {ev.photo_urls?.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {ev.photo_urls.map((url, i) => (
                          <img key={i} src={url} alt={`Evidence ${i + 1}`} className="h-20 w-20 object-cover rounded-lg border" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
            <label className="text-sm font-medium text-slate-700">Employee</label>
            <select value={assignEmployee} onChange={(e) => setAssignEmployee(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Select employee</option>
              {employees.filter((e) => !assignDept || e.department_id === assignDept).map((e) => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
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
