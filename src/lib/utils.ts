import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTrackingId(): string {
  const prefix = "CB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
    UNDER_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
    ASSIGNED: "bg-purple-100 text-purple-700 border-purple-200",
    IN_PROGRESS: "bg-sky-100 text-sky-700 border-sky-200",
    PENDING_VERIFICATION: "bg-orange-100 text-orange-700 border-orange-200",
    RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REOPENED: "bg-red-100 text-red-700 border-red-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };
  return colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    PENDING_VERIFICATION: "Pending Verification",
    RESOLVED: "Resolved",
    REOPENED: "Reopened",
    REJECTED: "Rejected",
  };
  return labels[status] || status;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-blue-100 text-blue-600",
    HIGH: "bg-amber-100 text-amber-700",
    URGENT: "bg-red-100 text-red-700",
  };
  return colors[priority] || "bg-slate-100 text-slate-600";
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    GARBAGE_WASTE: "Trash2",
    POTHOLE_ROADS: "Construction",
    STREETLIGHTS: "Lightbulb",
    DRAINAGE_SEWAGE: "Waves",
    WATER_SUPPLY: "Droplets",
    WOMEN_SAFETY: "Shield",
    PUBLIC_INFRASTRUCTURE: "Building2",
    OTHER: "CircleDot",
  };
  return icons[category] || "CircleDot";
}

export function getDepartmentForCategory(category: string): string {
  const mapping: Record<string, string> = {
    GARBAGE_WASTE: "Sanitation",
    POTHOLE_ROADS: "Roads and Public Works",
    STREETLIGHTS: "Electrical Maintenance",
    DRAINAGE_SEWAGE: "Drainage",
    WATER_SUPPLY: "Water Supply",
    WOMEN_SAFETY: "Safety Cell",
    PUBLIC_INFRASTRUCTURE: "Roads and Public Works",
    OTHER: "Sanitation",
  };
  return mapping[category] || "Sanitation";
}

export function lookupWardFromCoordinates(lat: number | null, lng: number | null): string {
  // Deterministic demo ward lookup based on coordinates
  // Default to Central Ward if coordinates unavailable or outside bounds
  if (lat === null || lng === null) return "w1000000-0000-0000-0000-000000000001";
  
  if (lat > 28.65) return "w1000000-0000-0000-0000-000000000002"; // North Ward
  if (lat < 28.55) return "w1000000-0000-0000-0000-000000000003"; // South Ward
  if (lng > 77.25) return "w1000000-0000-0000-0000-000000000004"; // East Ward
  if (lng < 77.15) return "w1000000-0000-0000-0000-000000000005"; // West Ward
  return "w1000000-0000-0000-0000-000000000001"; // Central Ward
}
