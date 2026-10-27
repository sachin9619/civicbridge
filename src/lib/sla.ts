/**
 * CivicBridge Citizen Charter & SLA Engine
 *
 * Configurable resolution deadlines based on complaint category and priority.
 * Used across complaint registration, escalation engine, and UI badges.
 */

import type { ComplaintCategory, Priority } from "@/types";

export interface SLARule {
  hours: number;
  label: string;
  escalatesTo: string;
}

// Citizen Charter resolution SLA matrix (in hours)
export const SLA_RULES: Record<Priority, Record<string, number>> = {
  URGENT: {
    DEFAULT: 12,
    WOMEN_SAFETY: 6,
    WATER_SUPPLY: 12,
    DRAINAGE_SEWAGE: 12,
  },
  HIGH: {
    DEFAULT: 24,
    GARBAGE_WASTE: 24,
    WATER_SUPPLY: 24,
    WOMEN_SAFETY: 12,
    POTHOLE_ROADS: 36,
    DRAINAGE_SEWAGE: 24,
  },
  MEDIUM: {
    DEFAULT: 48,
    GARBAGE_WASTE: 24,
    POTHOLE_ROADS: 48,
    STREETLIGHTS: 36,
    DRAINAGE_SEWAGE: 48,
    WATER_SUPPLY: 24,
    PUBLIC_INFRASTRUCTURE: 72,
    OTHER: 72,
  },
  LOW: {
    DEFAULT: 96,
    PUBLIC_INFRASTRUCTURE: 120,
    OTHER: 120,
  },
};

/**
 * Calculates deadline timestamp given category, priority, and creation time.
 */
export function calculateSLADeadline(
  category: ComplaintCategory,
  priority: Priority,
  createdAt: Date = new Date()
): Date {
  const priorityRules = SLA_RULES[priority] || SLA_RULES.MEDIUM;
  const hours = priorityRules[category] ?? priorityRules.DEFAULT ?? 48;
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Returns hours permitted under SLA
 */
export function getSLAHours(category: ComplaintCategory, priority: Priority): number {
  const priorityRules = SLA_RULES[priority] || SLA_RULES.MEDIUM;
  return priorityRules[category] ?? priorityRules.DEFAULT ?? 48;
}

export type SLAStatus = "ON_TRACK" | "NEARING_DEADLINE" | "BREACHED" | "RESOLVED_ON_TIME" | "RESOLVED_LATE";

export interface SLAEvaluation {
  status: SLAStatus;
  hoursRemaining: number;
  hoursOverdue: number;
  formattedText: string;
  isOverdue: boolean;
  escalationTarget: string;
}

/**
 * Evaluates current SLA condition for a complaint
 */
export function evaluateSLA(
  createdAtStr: string,
  deadlineStr: string | null,
  status: string,
  resolvedAtStr?: string | null
): SLAEvaluation {
  const created = new Date(createdAtStr);
  const deadline = deadlineStr ? new Date(deadlineStr) : new Date(created.getTime() + 48 * 60 * 60 * 1000);
  const now = new Date();

  // If already resolved
  if (status === "RESOLVED" || status === "REJECTED") {
    const resolved = resolvedAtStr ? new Date(resolvedAtStr) : now;
    const diff = deadline.getTime() - resolved.getTime();
    if (diff >= 0) {
      return {
        status: "RESOLVED_ON_TIME",
        hoursRemaining: 0,
        hoursOverdue: 0,
        formattedText: "Resolved within SLA",
        isOverdue: false,
        escalationTarget: "None",
      };
    } else {
      const lateHours = Math.abs(Math.round(diff / (1000 * 60 * 60)));
      return {
        status: "RESOLVED_LATE",
        hoursRemaining: 0,
        hoursOverdue: lateHours,
        formattedText: `Resolved with ${lateHours}h delay`,
        isOverdue: true,
        escalationTarget: "None",
      };
    }
  }

  // Active complaint check
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    const overdueHours = Math.abs(diffHours);
    return {
      status: "BREACHED",
      hoursRemaining: 0,
      hoursOverdue: overdueHours,
      formattedText: `SLA Breached · Overdue by ${overdueHours}h`,
      isOverdue: true,
      escalationTarget: "Zonal Municipal Commissioner",
    };
  }

  if (diffHours <= 6) {
    return {
      status: "NEARING_DEADLINE",
      hoursRemaining: Math.max(1, diffHours),
      hoursOverdue: 0,
      formattedText: `SLA Critical · ${diffHours}h remaining`,
      isOverdue: false,
      escalationTarget: "Executive Engineer",
    };
  }

  return {
    status: "ON_TRACK",
    hoursRemaining: diffHours,
    hoursOverdue: 0,
    formattedText: `SLA: ${diffHours}h remaining`,
    isOverdue: false,
    escalationTarget: "Standard Field Roster",
  };
}

/**
 * Convenience helper to determine if an active complaint has breached its SLA
 */
export function isComplaintOverdue(complaint: {
  created_at: string;
  deadline?: string | null;
  status: string;
}): boolean {
  if (complaint.status === "RESOLVED" || complaint.status === "REJECTED") {
    return false;
  }
  const evalResult = evaluateSLA(complaint.created_at, complaint.deadline || null, complaint.status);
  return evalResult.isOverdue;
}
