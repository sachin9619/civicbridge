export type UserRole = "citizen" | "admin" | "employee";

export type ComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING_VERIFICATION"
  | "RESOLVED"
  | "REOPENED"
  | "REJECTED";

export type ComplaintCategory =
  | "GARBAGE_WASTE"
  | "POTHOLE_ROADS"
  | "STREETLIGHTS"
  | "DRAINAGE_SEWAGE"
  | "WATER_SUPPLY"
  | "WOMEN_SAFETY"
  | "PUBLIC_INFRASTRUCTURE"
  | "OTHER";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  ward_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_name: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Ward {
  id: string;
  name: string;
  ward_number: number;
  area_description: string | null;
  boundaries: unknown | null;
  is_active: boolean;
  created_at: string;
}

export interface Complaint {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: Priority;
  reporter_id: string;
  department_id: string | null;
  ward_id: string | null;
  assigned_employee_id: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  photo_urls: string[];
  is_sensitive: boolean;
  deadline: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  reporter?: Profile;
  department?: Department;
  ward?: Ward;
  assigned_employee?: Profile;
}

export interface StatusHistoryEntry {
  id: string;
  complaint_id: string;
  old_status: ComplaintStatus | null;
  new_status: ComplaintStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
  changed_by_profile?: Profile;
}

export interface Assignment {
  id: string;
  complaint_id: string;
  assigned_to: string;
  assigned_by: string;
  department_id: string;
  ward_id: string | null;
  notes: string | null;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  assigned_to_profile?: Profile;
  assigned_by_profile?: Profile;
}

export interface ResolutionEvidence {
  id: string;
  complaint_id: string;
  submitted_by: string;
  photo_urls: string[];
  notes: string;
  is_approved: boolean | null;
  reviewer_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  submitted_by_profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  complaint_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}

export const COMPLAINT_CATEGORIES: { value: ComplaintCategory; label: string; icon: string; description: string }[] = [
  { value: "GARBAGE_WASTE", label: "Garbage & Waste", icon: "Trash2", description: "Garbage collection, waste dumping, overflowing bins" },
  { value: "POTHOLE_ROADS", label: "Potholes & Roads", icon: "Construction", description: "Potholes, damaged roads, broken footpaths" },
  { value: "STREETLIGHTS", label: "Streetlights", icon: "Lightbulb", description: "Broken or non-functional street lights" },
  { value: "DRAINAGE_SEWAGE", label: "Drainage & Sewage", icon: "Waves", description: "Blocked drains, sewage overflow, waterlogging" },
  { value: "WATER_SUPPLY", label: "Water Supply", icon: "Droplets", description: "Water shortage, contaminated water, pipe leaks" },
  { value: "WOMEN_SAFETY", label: "Women's Safety", icon: "Shield", description: "Safety concerns — handled with strict confidentiality" },
  { value: "PUBLIC_INFRASTRUCTURE", label: "Public Infrastructure", icon: "Building2", description: "Parks, bus stops, public buildings, bridges" },
  { value: "OTHER", label: "Other Issues", icon: "CircleDot", description: "Any other civic concern not listed above" },
];

export const STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "UNDER_REVIEW"],
  IN_PROGRESS: ["PENDING_VERIFICATION"],
  PENDING_VERIFICATION: ["RESOLVED", "IN_PROGRESS"],
  RESOLVED: ["REOPENED"],
  REOPENED: ["UNDER_REVIEW", "ASSIGNED"],
  REJECTED: ["UNDER_REVIEW"],
};
