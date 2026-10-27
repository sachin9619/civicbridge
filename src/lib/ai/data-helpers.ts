/**
 * CivicBridge AI — Supabase Data Helpers
 *
 * Server-side only. All queries are parameterized via the Supabase client.
 * The AI never generates or executes SQL — these helpers return formatted
 * text summaries that can be safely passed as context to the LLM.
 */

import { createClient } from "@/lib/supabase/server";

// -------------------------------------------------------------------
// CITIZEN helpers
// -------------------------------------------------------------------

/** Returns the citizen's own complaints, never another user's */
export async function getMyComplaintsSummary(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("id, tracking_id, title, status, priority, category, created_at, updated_at")
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return "No complaints found or database error.";
  if (data.length === 0) return "You have not submitted any complaints yet.";

  return data
    .map(
      (c) =>
        `- ${c.tracking_id} | ${c.title} | Status: ${c.status} | Priority: ${c.priority} | Category: ${c.category} | Submitted: ${new Date(c.created_at).toLocaleDateString("en-IN")}`
    )
    .join("\n");
}

/** Returns a single complaint detail — only if it belongs to the user */
export async function getMyComplaintDetail(
  userId: string,
  complaintId: string
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(
      "tracking_id, title, description, status, priority, category, address, created_at, updated_at, deadline, resolved_at, department:departments(name)"
    )
    .eq("id", complaintId)
    .eq("reporter_id", userId) // ownership enforced at DB level
    .single();

  if (error || !data) return "Complaint not found or access denied.";

  const { data: history } = await supabase
    .from("status_history")
    .select("new_status, notes, created_at")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: false })
    .limit(5);

  const historyText =
    history && history.length > 0
      ? history
          .map(
            (h) =>
              `  - ${h.new_status} on ${new Date(h.created_at).toLocaleDateString("en-IN")}${h.notes ? `: ${h.notes}` : ""}`
          )
          .join("\n")
      : "  No status history recorded.";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dept = (data as any).department?.name ?? "Not assigned";

  return `Complaint: ${data.tracking_id}
Title: ${data.title}
Description: ${data.description}
Status: ${data.status}
Priority: ${data.priority}
Category: ${data.category}
Department: ${dept}
Location: ${data.address ?? "Not provided"}
Submitted: ${new Date(data.created_at).toLocaleDateString("en-IN")}
Last updated: ${new Date(data.updated_at).toLocaleDateString("en-IN")}
Deadline: ${data.deadline ? new Date(data.deadline).toLocaleDateString("en-IN") : "Not set"}
Resolved: ${data.resolved_at ? new Date(data.resolved_at).toLocaleDateString("en-IN") : "Not resolved"}

Recent status history:
${historyText}`;
}

/** Search publicly visible similar complaints by category (excludes sensitive) */
export async function searchSimilarComplaints(
  category: string,
  limit = 5
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("tracking_id, title, status, category, address, created_at")
    .eq("category", category)
    .eq("is_sensitive", false) // never expose sensitive complaints
    .in("status", ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0)
    return `No similar complaints found for category: ${category}`;

  return data
    .map(
      (c) =>
        `- ${c.tracking_id} | ${c.title} | Status: ${c.status} | Area: ${c.address ?? "Unknown"} | Reported: ${new Date(c.created_at).toLocaleDateString("en-IN")}`
    )
    .join("\n");
}

// -------------------------------------------------------------------
// ADMIN helpers
// -------------------------------------------------------------------

/** Returns high-level complaint analytics for admin AI context */
export async function getComplaintAnalyticsSummary(): Promise<string> {
  const supabase = await createClient();
  const { data: all, error } = await supabase
    .from("complaints")
    .select("status, priority, category, created_at, deadline");

  if (error || !all) return "Unable to fetch complaint analytics.";

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const total = all.length;
  const byStatus = all.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const byCategory = all.reduce(
    (acc, c) => {
      acc[c.category] = (acc[c.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const overdue = all.filter(
    (c) =>
      c.deadline &&
      new Date(c.deadline) < now &&
      !["RESOLVED", "REJECTED"].includes(c.status)
  ).length;

  const thisWeek = all.filter(
    (c) => new Date(c.created_at) >= weekAgo
  ).length;

  const urgent = all.filter(
    (c) => c.priority === "URGENT" && !["RESOLVED", "REJECTED"].includes(c.status)
  ).length;

  const statusSummary = Object.entries(byStatus)
    .sort(([, a], [, b]) => b - a)
    .map(([s, n]) => `  ${s}: ${n}`)
    .join("\n");

  const catSummary = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([c, n]) => `  ${c.replace(/_/g, " ")}: ${n}`)
    .join("\n");

  return `Complaint Analytics (as of ${now.toLocaleDateString("en-IN")}):
Total complaints: ${total}
New this week: ${thisWeek}
Overdue (deadline passed, unresolved): ${overdue}
Active urgent complaints: ${urgent}

By status:
${statusSummary}

By category:
${catSummary}`;
}

/** Returns list of eligible employees for a department */
export async function getEligibleWorkers(departmentId: string): Promise<string> {
  const supabase = await createClient();

  const { data: employees, error } = await supabase
    .from("profiles")
    .select("id, full_name, department_id, is_active")
    .eq("role", "employee")
    .eq("is_active", true)
    .eq("department_id", departmentId);

  if (error || !employees || employees.length === 0) {
    return "No active employees found for this department.";
  }

  // Get current workload for each employee
  const { data: assignments } = await supabase
    .from("complaints")
    .select("assigned_employee_id, status")
    .in("assigned_employee_id", employees.map((e) => e.id))
    .not("status", "in", '("RESOLVED","REJECTED")');

  const workload = (assignments ?? []).reduce(
    (acc, a) => {
      if (a.assigned_employee_id) {
        acc[a.assigned_employee_id] = (acc[a.assigned_employee_id] ?? 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return employees
    .map(
      (e) =>
        `- ${e.full_name} | Active tasks: ${workload[e.id] ?? 0}`
    )
    .join("\n");
}

/** Returns overdue complaints for admin review */
export async function getOverdueComplaintsSummary(limit = 10): Promise<string> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("complaints")
    .select("tracking_id, title, status, priority, category, deadline, department:departments(name)")
    .not("status", "in", '("RESOLVED","REJECTED")')
    .not("deadline", "is", null)
    .lt("deadline", now)
    .order("deadline", { ascending: true })
    .limit(limit);

  if (error || !data || data.length === 0) return "No overdue complaints found.";

  return data
    .map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dept = (c as any).department?.name ?? "Unassigned";
      return `- ${c.tracking_id} | ${c.title} | ${c.status} | ${c.priority} | ${c.category.replace(/_/g, " ")} | Dept: ${dept} | Due: ${new Date(c.deadline!).toLocaleDateString("en-IN")}`;
    })
    .join("\n");
}

// -------------------------------------------------------------------
// WORKER helpers
// -------------------------------------------------------------------

/** Returns tasks assigned to the worker — never other workers' tasks */
export async function getMyAssignedTasksSummary(employeeId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("id, tracking_id, title, status, priority, category, address, deadline, description")
    .eq("assigned_employee_id", employeeId)
    .not("status", "in", '("RESOLVED","REJECTED")')
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(20);

  if (error || !data) return "No tasks found or database error.";
  if (data.length === 0) return "You have no active assigned tasks.";

  return data
    .map(
      (c) =>
        `- ${c.tracking_id} | ${c.title} | ${c.status} | ${c.priority} | ${c.category.replace(/_/g, " ")}${c.deadline ? ` | Due: ${new Date(c.deadline).toLocaleDateString("en-IN")}` : ""}`
    )
    .join("\n");
}

/** Returns a single task detail — only if assigned to the worker */
export async function getAssignedTaskDetail(
  employeeId: string,
  complaintId: string
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(
      "tracking_id, title, description, status, priority, category, address, created_at, deadline, photo_urls, department:departments(name)"
    )
    .eq("id", complaintId)
    .eq("assigned_employee_id", employeeId) // assignment enforced at DB level
    .single();

  if (error || !data) return "Task not found or not assigned to you.";

  const { data: history } = await supabase
    .from("status_history")
    .select("new_status, notes, created_at")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });

  const historyText =
    history && history.length > 0
      ? history
          .map(
            (h) =>
              `  - ${h.new_status}: ${h.notes ?? "No notes"}`
          )
          .join("\n")
      : "  No history.";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dept = (data as any).department?.name ?? "Unknown";
  const photoCount = Array.isArray(data.photo_urls) ? data.photo_urls.length : 0;

  return `Task: ${data.tracking_id}
Title: ${data.title}
Description: ${data.description}
Status: ${data.status}
Priority: ${data.priority}
Category: ${data.category.replace(/_/g, " ")}
Department: ${dept}
Location: ${data.address ?? "Not provided"}
Reported: ${new Date(data.created_at).toLocaleDateString("en-IN")}
Deadline: ${data.deadline ? new Date(data.deadline).toLocaleDateString("en-IN") : "Not set"}
Issue photos attached: ${photoCount}

Status history:
${historyText}`;
}

// -------------------------------------------------------------------
// CIVICPULSE helpers
// -------------------------------------------------------------------

/** Returns public complaint clusters for CivicPulse display */
export async function getPublicComplaintClusters(
  category?: string,
  limit = 50
): Promise<string> {
  const supabase = await createClient();

  let query = supabase
    .from("complaints")
    .select(
      "id, tracking_id, title, category, status, priority, address, latitude, longitude, created_at, updated_at"
    )
    .eq("is_sensitive", false) // strictly exclude sensitive complaints
    .not("status", "in", '("REJECTED")')
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return "No public complaints available.";

  return data
    .map(
      (c) =>
        `- ID: ${c.id} | ${c.tracking_id} | ${c.title} | ${c.category} | ${c.status} | ${c.priority} | Area: ${c.address ?? "Unknown"} | Reported: ${new Date(c.created_at).toLocaleDateString("en-IN")}`
    )
    .join("\n");
}

