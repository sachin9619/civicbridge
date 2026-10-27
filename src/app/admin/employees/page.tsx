"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users, UserPlus, Search, Building2, MapPin, Trash2, Edit3,
  Power, Briefcase, RefreshCw, AlertCircle, CheckCircle2, Shield,
  Key, Eye, EyeOff, Copy, Check, Filter, UserCheck, UserX,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Profile, Department, Ward } from "@/types";

interface EnrichedEmployee extends Profile {
  department?: Department | null;
  ward?: Ward | null;
  activeTasksCount?: number;
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EnrichedEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EnrichedEmployee | null>(null);

  // Add Form state
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("CivicStaff@2026!");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addDept, setAddDept] = useState("");
  const [addWard, setAddWard] = useState("");
  const [addRole, setAddRole] = useState<"employee" | "admin">("employee");
  const [addIsActive, setAddIsActive] = useState(true);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addSuccessInfo, setAddSuccessInfo] = useState<{ email: string; password?: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Edit Form state
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editWard, setEditWard] = useState("");
  const [editRole, setEditRole] = useState<"employee" | "admin">("employee");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Form state
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteForceConfirm, setDeleteForceConfirm] = useState(false);

  // Fetch all data
  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const supabase = createClient();

      const [deptRes, wardRes, staffRes, compRes] = await Promise.all([
        supabase.from("departments").select("*").order("name"),
        supabase.from("wards").select("*").order("ward_number"),
        supabase
          .from("profiles")
          .select("*, department:departments(*), ward:wards(*)")
          .in("role", ["employee", "admin"])
          .order("created_at", { ascending: false }),
        supabase
          .from("complaints")
          .select("id, assigned_employee_id, status")
          .in("status", ["ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION"])
          .not("assigned_employee_id", "is", null),
      ]);

      const depts = deptRes.data || [];
      const wrds = wardRes.data || [];
      setDepartments(depts);
      setWards(wrds);

      const taskCounts: Record<string, number> = {};
      compRes.data?.forEach((c) => {
        if (c.assigned_employee_id) {
          taskCounts[c.assigned_employee_id] = (taskCounts[c.assigned_employee_id] || 0) + 1;
        }
      });

      const staff = (staffRes.data || []).map((emp) => ({
        ...emp,
        activeTasksCount: taskCounts[emp.id] || 0,
      }));

      setEmployees(staff);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load staff data" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-dismiss feedback after 6 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.full_name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.department?.name && emp.department.name.toLowerCase().includes(q));

      // Dept filter
      const matchesDept = departmentFilter === "ALL" || emp.department_id === departmentFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && emp.is_active) ||
        (statusFilter === "INACTIVE" && !emp.is_active);

      // Role filter
      const matchesRole = roleFilter === "ALL" || emp.role === roleFilter;

      return matchesSearch && matchesDept && matchesStatus && matchesRole;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.is_active && e.role === "employee").length;
    const inactive = employees.filter((e) => !e.is_active).length;
    const admins = employees.filter((e) => e.role === "admin").length;
    const busyWithTasks = employees.filter((e) => (e.activeTasksCount || 0) > 0).length;
    return { total, active, inactive, admins, busyWithTasks };
  }, [employees]);

  // Quick generate password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pass = "Civic@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += "1!";
    setAddPassword(pass);
  };

  // Open Edit Dialog
  const handleOpenEdit = (emp: EnrichedEmployee) => {
    setSelectedEmployee(emp);
    setEditName(emp.full_name);
    setEditDept(emp.department_id || "");
    setEditWard(emp.ward_id || "");
    setEditRole(emp.role as "employee" | "admin");
    setEditIsActive(emp.is_active);
    setIsEditOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (emp: EnrichedEmployee) => {
    setSelectedEmployee(emp);
    setDeleteForceConfirm(false);
    setIsDeleteOpen(true);
  };

  // Quick 1-Click Status Toggle
  const handleToggleStatus = async (emp: EnrichedEmployee) => {
    try {
      const res = await fetch("/api/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: emp.id,
          is_active: !emp.is_active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, is_active: !e.is_active } : e))
      );
      setFeedback({
        type: "success",
        message: `${emp.full_name} is now ${!emp.is_active ? "Active" : "Deactivated / Suspended"}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update employee status" });
    }
  };

  // Submit Add Form
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) {
      setFeedback({ type: "error", message: "Full Name and Email are required" });
      return;
    }

    setIsSubmittingAdd(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: addName.trim(),
          email: addEmail.trim(),
          password: addPassword,
          department_id: addDept || null,
          ward_id: addWard || null,
          role: addRole,
          is_active: addIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee");

      setAddSuccessInfo({ email: addEmail.trim(), password: addPassword });
      setFeedback({ type: "success", message: `Account created for ${addName}!` });
      await fetchData();

      // Reset fields
      setAddName("");
      setAddEmail("");
      generateRandomPassword();
      setAddDept("");
      setAddWard("");
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to create employee" });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Submit Edit Form
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setIsSubmittingEdit(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEmployee.id,
          full_name: editName.trim(),
          department_id: editDept || null,
          ward_id: editWard || null,
          role: editRole,
          is_active: editIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update employee");

      setFeedback({ type: "success", message: `Updated details for ${editName}!` });
      setIsEditOpen(false);
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update employee" });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Submit Delete Form
  const handleSubmitDelete = async () => {
    if (!selectedEmployee) return;

    setIsSubmittingDelete(true);
    setFeedback(null);

    try {
      const res = await fetch(
        `/api/admin/employees?id=${selectedEmployee.id}&force=${deleteForceConfirm}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (res.status === 409 && data.requiresForce) {
        // Needs force confirmation due to active tasks
        setDeleteForceConfirm(true);
        setFeedback({
          type: "error",
          message: `${data.message} Tick the box below to unassign pending complaints and proceed.`,
        });
        setIsSubmittingDelete(false);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to delete employee");

      setFeedback({
        type: "success",
        message: data.message || `Employee ${selectedEmployee.full_name} removed.`,
      });
      setIsDeleteOpen(false);
      setSelectedEmployee(null);
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete employee" });
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const copyCredentials = () => {
    if (!addSuccessInfo) return;
    const text = `CivicBridge Staff Login:\nEmail: ${addSuccessInfo.email}\nPassword: ${addSuccessInfo.password}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-sm transition-all animate-in fade-in-0 slide-in-from-top-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <p className="font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            &times;
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Staff & Employee Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision, assign, update, and manage municipal field staff and administrative officers.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setAddSuccessInfo(null);
              setIsAddOpen(true);
            }}
            className="gap-2 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Add New Employee
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Staff</p>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Employees</p>
              <p className="text-xl font-bold text-slate-900">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">With Active Tasks</p>
              <p className="text-xl font-bold text-slate-900">{stats.busyWithTasks}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Deactivated</p>
              <p className="text-xl font-bold text-slate-900">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Deactivated Only</option>
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              >
                <option value="ALL">All Roles</option>
                <option value="employee">Employees / Field Workers</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Roster / Directory */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={employees.length === 0 ? "No Staff Registered" : "No Staff Matching Criteria"}
          description={
            employees.length === 0
              ? "No municipal employees or staff have been added yet. Click 'Add New Employee' to register your first staff member."
              : "Try adjusting your search terms or filters above to find staff members."
          }
          action={
            employees.length === 0 ? (
              <Button
                variant="primary"
                onClick={() => {
                  setAddSuccessInfo(null);
                  setIsAddOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Employee
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setDepartmentFilter("ALL");
                  setStatusFilter("ALL");
                  setRoleFilter("ALL");
                }}
              >
                Clear Filters
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id}
              className={`border transition-all hover:shadow-md ${
                !emp.is_active
                  ? "bg-slate-50/70 border-slate-200 opacity-80"
                  : "bg-white border-slate-200"
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={emp.full_name} className="h-11 w-11 text-base font-semibold" />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        emp.is_active ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                      title={emp.is_active ? "Active" : "Deactivated"}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900 truncate">
                        {emp.full_name}
                      </p>
                      <Badge
                        variant={emp.role === "admin" ? "purple" : "primary"}
                        className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5"
                      >
                        {emp.role}
                      </Badge>
                      {emp.is_active ? (
                        <Badge variant="success" className="text-[10px] px-2 py-0.5">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5">
                          Suspended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{emp.email}</p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {emp.department ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <Building2 className="h-3 w-3" />
                          {emp.department.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Building2 className="h-3 w-3" />
                          No Dept Assigned
                        </span>
                      )}

                      {emp.ward ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          <MapPin className="h-3 w-3" />
                          Ward {emp.ward.ward_number}: {emp.ward.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          <MapPin className="h-3 w-3" />
                          All Wards
                        </span>
                      )}

                      {emp.role === "employee" && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                            (emp.activeTasksCount || 0) > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          <Briefcase className="h-3 w-3" />
                          {emp.activeTasksCount || 0} active complaint
                          {(emp.activeTasksCount || 0) === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                  {/* Status Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(emp)}
                    title={emp.is_active ? "Deactivate employee account" : "Activate employee account"}
                    className={`gap-1.5 text-xs ${
                      emp.is_active
                        ? "text-slate-600 hover:text-amber-700 hover:border-amber-200"
                        : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {emp.is_active ? "Deactivate" : "Activate"}
                  </Button>

                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(emp)}
                    title="Edit employee details"
                    className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDelete(emp)}
                    title="Delete employee account"
                    className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ================= ADD EMPLOYEE DIALOG ================= */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Add New Employee / Staff</DialogTitle>
              <DialogDescription>
                Provision a municipal field officer or admin. They can immediately log in to handle civic tasks.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {addSuccessInfo ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Staff Account Successfully Created!
              </div>
              <p className="text-xs text-emerald-700">
                Share the login credentials below with the employee so they can access the portal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-xs font-semibold uppercase text-slate-500">Email:</span>
                <span className="font-mono font-medium">{addSuccessInfo.email}</span>
              </div>
              {addSuccessInfo.password && (
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-xs font-semibold uppercase text-slate-500">Password:</span>
                  <span className="font-mono font-medium">{addSuccessInfo.password}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={copyCredentials}
            >
              {copiedPass ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedPass ? "Credentials Copied to Clipboard!" : "Copy Login Credentials"}
            </Button>

            <DialogFooter className="mt-4">
              <Button
                variant="primary"
                onClick={() => {
                  setAddSuccessInfo(null);
                  setIsAddOpen(false);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmitAdd} className="space-y-4 py-2">
            <div className="space-y-3">
              <Input
                label="Full Name *"
                placeholder="e.g. Ramesh Kumar"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />

              <Input
                label="Email Address *"
                type="email"
                placeholder="e.g. ramesh.kumar@civicbridge.gov"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
              />

              {/* Password with generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Min. 6 characters. The staff member can use this to sign in.</p>
              </div>

              {/* Department Select */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Department</label>
                <select
                  value={addDept}
                  onChange={(e) => setAddDept(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward Select */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Assigned Ward</label>
                <select
                  value={addWard}
                  onChange={(e) => setAddWard(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                >
                  <option value="">All Wards (City-wide)</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      Ward {w.ward_number}: {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Select */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Portal Role</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as "employee" | "admin")}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                  >
                    <option value="employee">Field Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Account Status</label>
                  <select
                    value={addIsActive ? "true" : "false"}
                    onChange={(e) => setAddIsActive(e.target.value === "true")}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                  >
                    <option value="true">Active (Immediate Access)</option>
                    <option value="false">Inactive / Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmittingAdd} className="gap-2">
                {isSubmittingAdd && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isSubmittingAdd ? "Creating Account..." : "Create Employee Account"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      {/* ================= EDIT EMPLOYEE DIALOG ================= */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit Staff Details</DialogTitle>
              <DialogDescription>
                Update department allocation, assigned ward, or portal permissions for this employee.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {selectedEmployee && (
          <form onSubmit={handleSubmitEdit} className="space-y-4 py-2">
            <div className="space-y-3">
              <Input
                label="Full Name *"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="text"
                  value={selectedEmployee.email}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">Email is linked to Supabase Auth login.</p>
              </div>

              {/* Department Select */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                >
                  <option value="">No Department Assigned</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward Select */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Assigned Ward</label>
                <select
                  value={editWard}
                  onChange={(e) => setEditWard(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                >
                  <option value="">All Wards (City-wide)</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      Ward {w.ward_number}: {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as "employee" | "admin")}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                  >
                    <option value="employee">Field Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Account Status</label>
                  <select
                    value={editIsActive ? "true" : "false"}
                    onChange={(e) => setEditIsActive(e.target.value === "true")}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive / Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmittingEdit} className="gap-2">
                {isSubmittingEdit && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isSubmittingEdit ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-red-950">Remove Staff Member?</DialogTitle>
              <DialogDescription>
                This action will revoke all portal access and remove this staff member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {selectedEmployee && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
              <p className="font-semibold text-slate-900">{selectedEmployee.full_name}</p>
              <p className="text-xs text-slate-500">{selectedEmployee.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant={selectedEmployee.role === "admin" ? "purple" : "primary"} className="text-[10px]">
                  {selectedEmployee.role}
                </Badge>
                {selectedEmployee.department?.name && (
                  <Badge variant="default" className="text-[10px]">
                    {selectedEmployee.department.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Warning if employee has active assigned complaints */}
            {(selectedEmployee.activeTasksCount || 0) > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  Active Assigned Complaints ({selectedEmployee.activeTasksCount})
                </div>
                <p>
                  This employee currently has {selectedEmployee.activeTasksCount} complaint(s) in progress.
                  Confirming deletion will unassign these complaints back to &quot;Under Review&quot; so another officer can take over.
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium text-amber-950">
                  <input
                    type="checkbox"
                    checked={deleteForceConfirm}
                    onChange={(e) => setDeleteForceConfirm(e.target.checked)}
                    className="rounded border-amber-300 text-blue-600 focus:ring-blue-500"
                  />
                  Unassign active complaints and proceed with deletion
                </label>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={
                  isSubmittingDelete ||
                  ((selectedEmployee.activeTasksCount || 0) > 0 && !deleteForceConfirm)
                }
                onClick={handleSubmitDelete}
                className="gap-2"
              >
                {isSubmittingDelete && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isSubmittingDelete ? "Deleting..." : "Confirm Delete"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
