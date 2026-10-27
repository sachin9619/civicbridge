"use client";

import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { evaluateSLA } from "@/lib/sla";

interface SLABadgeProps {
  complaint?: {
    created_at: string;
    deadline?: string | null;
    status: string;
    resolved_at?: string | null;
  };
  createdAt?: string;
  deadline?: string | null;
  status?: string;
  resolvedAt?: string | null;
  className?: string;
  showIcon?: boolean;
}

export function SLABadge({
  complaint,
  createdAt,
  deadline,
  status,
  resolvedAt,
  className = "",
  showIcon = true,
}: SLABadgeProps) {
  const effectiveCreatedAt = complaint?.created_at || createdAt || new Date().toISOString();
  const effectiveDeadline = complaint ? (complaint.deadline ?? null) : (deadline ?? null);
  const effectiveStatus = complaint?.status || status || "SUBMITTED";
  const effectiveResolvedAt = complaint ? (complaint.resolved_at ?? null) : (resolvedAt ?? null);

  const evalResult = evaluateSLA(
    effectiveCreatedAt,
    effectiveDeadline,
    effectiveStatus,
    effectiveResolvedAt
  );

  const styles = {
    BREACHED: "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse",
    NEARING_DEADLINE: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
    ON_TRACK: "bg-blue-50 text-blue-700 border-blue-200 font-medium",
    RESOLVED_ON_TIME: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
    RESOLVED_LATE: "bg-orange-50 text-orange-700 border-orange-200 font-medium",
  };

  const icons = {
    BREACHED: ShieldAlert,
    NEARING_DEADLINE: AlertTriangle,
    ON_TRACK: Clock,
    RESOLVED_ON_TIME: CheckCircle2,
    RESOLVED_LATE: Clock,
  };

  const IconComponent = icons[evalResult.status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] border ${styles[evalResult.status]} ${className}`}
      title={`Citizen Charter Escalation Target: ${evalResult.escalationTarget}`}
    >
      {showIcon && <IconComponent className="h-3 w-3 shrink-0" />}
      <span>{evalResult.formattedText}</span>
    </span>
  );
}
