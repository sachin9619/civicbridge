import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceKey && url) {
    return createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return null;
}

function getIsolatedAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET: Fetch all staff with department, ward, and count of active complaints
export async function GET() {
  try {
    const serverSupabase = await createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const adminClient = getAdminClient();
    const queryClient = adminClient || serverSupabase;

    // Fetch staff
    const { data: staff, error: staffError } = await queryClient
      .from("profiles")
      .select("*, department:departments(*), ward:wards(*)")
      .in("role", ["employee", "admin"])
      .order("created_at", { ascending: false });

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 400 });
    }

    // Fetch active complaints per employee
    const { data: activeComplaints } = await queryClient
      .from("complaints")
      .select("id, assigned_employee_id, status")
      .in("status", ["ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION"])
      .not("assigned_employee_id", "is", null);

    const taskCountMap: Record<string, number> = {};
    activeComplaints?.forEach((c) => {
      if (c.assigned_employee_id) {
        taskCountMap[c.assigned_employee_id] = (taskCountMap[c.assigned_employee_id] || 0) + 1;
      }
    });

    const enrichedStaff = (staff || []).map((emp) => ({
      ...emp,
      activeTasksCount: taskCountMap[emp.id] || 0,
    }));

    return NextResponse.json({ staff: enrichedStaff });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Add new employee
export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, full_name, department_id, ward_id, role, is_active } = body;

    if (!email || !full_name) {
      return NextResponse.json({ error: "Email and full name are required" }, { status: 400 });
    }

    const pwd = password || `CivicPass@${Math.floor(1000 + Math.random() * 9000)}`;
    const adminClient = getAdminClient();
    let newUserId: string | null = null;

    if (adminClient) {
      // Create user via Admin API with auto-confirmed email
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: pwd,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
      newUserId = authUser.user?.id || null;
    } else {
      // Fallback: create user via isolated client without session persistence
      const isolatedClient = getIsolatedAnonClient();
      const { data: authData, error: authError } = await isolatedClient.auth.signUp({
        email,
        password: pwd,
        options: {
          data: { full_name },
        },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
      newUserId = authData.user?.id || null;
    }

    if (!newUserId) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 400 });
    }

    // Upsert profile data
    const dbClient = adminClient || serverSupabase;
    const { data: updatedProfile, error: profileError } = await dbClient
      .from("profiles")
      .upsert({
        id: newUserId,
        email,
        full_name,
        role: role || "employee",
        department_id: department_id || null,
        ward_id: ward_id || null,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select("*, department:departments(*), ward:wards(*)")
      .single();

    if (profileError) {
      return NextResponse.json({
        error: `Account created in Auth, but profile update failed: ${profileError.message}`,
        userId: newUserId,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      employee: updatedProfile,
      tempPassword: password ? undefined : pwd,
      message: "Employee successfully created",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// PATCH: Edit employee details
export async function PATCH(req: Request) {
  try {
    const serverSupabase = await createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, full_name, department_id, ward_id, role, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (department_id !== undefined) updatePayload.department_id = department_id || null;
    if (ward_id !== undefined) updatePayload.ward_id = ward_id || null;
    if (role !== undefined) updatePayload.role = role;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const adminClient = getAdminClient();
    const dbClient = adminClient || serverSupabase;

    const { data: updated, error } = await dbClient
      .from("profiles")
      .update(updatePayload)
      .eq("id", id)
      .select("*, department:departments(*), ward:wards(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, employee: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete or deactivate employee
export async function DELETE(req: Request) {
  try {
    const serverSupabase = await createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    // Do not allow admin to delete themselves
    if (id === user.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const dbClient = adminClient || serverSupabase;

    // Check active complaints assigned to this employee
    const { data: activeComplaints } = await dbClient
      .from("complaints")
      .select("id, tracking_id, title, status")
      .eq("assigned_employee_id", id)
      .in("status", ["ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION"]);

    if (activeComplaints && activeComplaints.length > 0 && !force) {
      return NextResponse.json({
        success: false,
        requiresForce: true,
        activeTasksCount: activeComplaints.length,
        message: `Employee has ${activeComplaints.length} active complaint(s) in progress. Please reassign them or confirm unassignment to delete.`,
      }, { status: 409 });
    }

    // If force is requested and active complaints exist, unassign them
    if (activeComplaints && activeComplaints.length > 0 && force) {
      await dbClient
        .from("complaints")
        .update({
          assigned_employee_id: null,
          status: "UNDER_REVIEW",
          updated_at: new Date().toISOString(),
        })
        .eq("assigned_employee_id", id);

      await dbClient
        .from("assignments")
        .update({ is_active: false })
        .eq("assigned_to", id);
    }

    // Attempt hard deletion
    let deleteError: any = null;
    if (adminClient) {
      const { error: authDelError } = await adminClient.auth.admin.deleteUser(id);
      if (authDelError) deleteError = authDelError;
    } else {
      const { error: profDelError } = await dbClient
        .from("profiles")
        .delete()
        .eq("id", id);
      if (profDelError) deleteError = profDelError;
    }

    // If hard delete fails (e.g. foreign key constraint from resolution_evidence, audit_logs, status_history),
    // gracefully fallback to soft deactivation
    if (deleteError) {
      await dbClient
        .from("profiles")
        .update({
          is_active: false,
          department_id: null,
          ward_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: "Employee has historical task records and cannot be permanently purged from database audit logs. Account has been deactivated and removed from active roster.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Employee account permanently deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
