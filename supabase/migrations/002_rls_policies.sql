-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get user role
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Employees can read profiles in their department
CREATE POLICY "Employees can read department profiles"
  ON profiles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'employee'
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  );

-- Users can update their own non-role fields
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- DEPARTMENTS POLICIES
-- ============================================
-- Everyone authenticated can read departments
CREATE POLICY "Authenticated users can read departments"
  ON departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage departments
CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- WARDS POLICIES
-- ============================================
-- Everyone authenticated can read wards
CREATE POLICY "Authenticated users can read wards"
  ON wards FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage wards
CREATE POLICY "Admins can manage wards"
  ON wards FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- COMPLAINTS POLICIES
-- ============================================
-- Citizens can read their own complaints
CREATE POLICY "Citizens can read own complaints"
  ON complaints FOR SELECT
  USING (reporter_id = auth.uid());

-- Citizens can create complaints (as themselves)
CREATE POLICY "Citizens can create complaints"
  ON complaints FOR INSERT
  WITH CHECK (reporter_id = auth.uid() AND status = 'SUBMITTED');

-- Admins can read all non-sensitive complaints
CREATE POLICY "Admins can read complaints"
  ON complaints FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Employees can read assigned complaints
CREATE POLICY "Employees can read assigned complaints"
  ON complaints FOR SELECT
  USING (assigned_employee_id = auth.uid());

-- Admins can update complaints
CREATE POLICY "Admins can update complaints"
  ON complaints FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- Employees can update assigned complaints (limited fields)
CREATE POLICY "Employees can update assigned complaints"
  ON complaints FOR UPDATE
  USING (assigned_employee_id = auth.uid())
  WITH CHECK (assigned_employee_id = auth.uid());

-- ============================================
-- STATUS HISTORY POLICIES
-- ============================================
-- Citizens can read history of their complaints
CREATE POLICY "Citizens can read own complaint history"
  ON status_history FOR SELECT
  USING (
    complaint_id IN (SELECT id FROM complaints WHERE reporter_id = auth.uid())
  );

-- Admins can read all history
CREATE POLICY "Admins can read all history"
  ON status_history FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Employees can read history of assigned complaints
CREATE POLICY "Employees can read assigned complaint history"
  ON status_history FOR SELECT
  USING (
    complaint_id IN (SELECT id FROM complaints WHERE assigned_employee_id = auth.uid())
  );

-- Admins and employees can insert history
CREATE POLICY "Staff can insert history"
  ON status_history FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'employee')
    AND changed_by = auth.uid()
  );

-- ============================================
-- ASSIGNMENTS POLICIES
-- ============================================
-- Admins can manage all assignments
CREATE POLICY "Admins can manage assignments"
  ON assignments FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Employees can read their assignments
CREATE POLICY "Employees can read own assignments"
  ON assignments FOR SELECT
  USING (assigned_to = auth.uid());

-- ============================================
-- RESOLUTION EVIDENCE POLICIES
-- ============================================
-- Employees can submit evidence for their assigned complaints
CREATE POLICY "Employees can submit evidence"
  ON resolution_evidence FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND complaint_id IN (SELECT id FROM complaints WHERE assigned_employee_id = auth.uid())
  );

-- Employees can read their own evidence
CREATE POLICY "Employees can read own evidence"
  ON resolution_evidence FOR SELECT
  USING (submitted_by = auth.uid());

-- Admins can read and manage all evidence
CREATE POLICY "Admins can manage evidence"
  ON resolution_evidence FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Citizens can read approved evidence for their complaints
CREATE POLICY "Citizens can read approved evidence"
  ON resolution_evidence FOR SELECT
  USING (
    is_approved = true
    AND complaint_id IN (SELECT id FROM complaints WHERE reporter_id = auth.uid())
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System/admins can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================
-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Authenticated users can create audit logs
CREATE POLICY "Authenticated users can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND actor_id = auth.uid());
