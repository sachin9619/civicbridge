"use client";

/**
 * CivicPulse — Live Neighborhood Intelligence
 *
 * Fetches AI-generated civic alerts derived from actual complaint records.
 * Displayed on the citizen dashboard.
 */

import { useEffect, useState } from "react";
import {
  Radio, MapPin, Clock, Users, RefreshCw, AlertCircle,
  CheckCircle2, AlertTriangle, Info, Filter, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CivicAlert {
  id: string;
  headline: string;
  summary: string;
  category: string;
  affectedArea: string;
  reportCount: number;
  firstReported: string;
  latestUpdate: string;
  status: string;
  verificationLevel:
    | "citizen_reported"
    | "multiple_reports"
    | "official_confirmed"
    | "resolved"
    | "stale";
  relatedComplaintIds: string[];
  coordinates?: { lat: number; lng: number };
  severity: "low" | "medium" | "high" | "urgent";
}

interface CivicPulseResponse {
  alerts: CivicAlert[];
  total: number;
  model: string | null;
  aiAvailable: boolean;
  generatedAt?: string;
}

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "GARBAGE_WASTE", label: "Garbage & Waste" },
  { value: "POTHOLE_ROADS", label: "Potholes & Roads" },
  { value: "STREETLIGHTS", label: "Streetlights" },
  { value: "DRAINAGE_SEWAGE", label: "Drainage & Sewage" },
  { value: "WATER_SUPPLY", label: "Water Supply" },
  { value: "PUBLIC_INFRASTRUCTURE", label: "Public Infrastructure" },
  { value: "OTHER", label: "Other" },
];

function getVerificationConfig(level: CivicAlert["verificationLevel"]) {
  switch (level) {
    case "resolved":
      return {
        label: "Resolved",
        icon: CheckCircle2,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "official_confirmed":
      return {
        label: "Officially Confirmed",
        icon: CheckCircle2,
        color: "text-blue-700 bg-blue-50 border-blue-200",
        dot: "bg-blue-500",
      };
    case "multiple_reports":
      return {
        label: "Multiple Reports",
        icon: Users,
        color: "text-amber-700 bg-amber-50 border-amber-200",
        dot: "bg-amber-500",
      };
    case "stale":
      return {
        label: "Stale — Awaiting Update",
        icon: Clock,
        color: "text-slate-600 bg-slate-50 border-slate-200",
        dot: "bg-slate-400",
      };
    default:
      return {
        label: "Citizen-Reported",
        icon: Info,
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
        dot: "bg-indigo-400",
      };
  }
}

function getSeverityBorder(severity: CivicAlert["severity"]) {
  switch (severity) {
    case "urgent":
      return "border-l-4 border-l-red-500";
    case "high":
      return "border-l-4 border-l-amber-500";
    case "medium":
      return "border-l-4 border-l-blue-400";
    default:
      return "border-l-4 border-l-slate-200";
  }
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

export function CivicPulseFeed() {
  const [data, setData] = useState<CivicPulseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchAlerts = async (category = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/ai/civicpulse${category ? `?category=${category}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const json: CivicPulseResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(selectedCategory);
  }, [selectedCategory]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Radio className="h-4 w-4 text-white" />
            </div>
            CivicPulse
            <span className="text-[10px] font-normal text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Neighborhood Alerts
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((f) => !f)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Filters"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchAlerts(selectedCategory)}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedCategory(opt.value)}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border transition-colors",
                  selectedCategory === opt.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading neighborhood alerts...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-6 text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Failed to load alerts</p>
              <p className="text-xs text-red-500">{error}</p>
              <button
                onClick={() => fetchAlerts(selectedCategory)}
                className="text-xs text-red-600 hover:underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        ) : !data || data.alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">All clear in your area</p>
            <p className="text-xs text-slate-400 mt-1">
              No active civic alerts found
              {selectedCategory ? ` for ${selectedCategory.replace(/_/g, " ")}` : ""}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.alerts.map((alert) => {
              const verify = getVerificationConfig(alert.verificationLevel);
              const VerifyIcon = verify.icon;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow",
                    getSeverityBorder(alert.severity)
                  )}
                >
                  {/* Verification badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                        verify.color
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", verify.dot)} />
                      <VerifyIcon className="h-2.5 w-2.5" />
                      {verify.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatRelative(alert.latestUpdate)}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug capitalize mb-1">
                    {alert.headline}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {alert.summary}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.affectedArea}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {alert.reportCount}{" "}
                      {alert.reportCount === 1 ? "report" : "reports"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      First reported {formatRelative(alert.firstReported)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] text-slate-400">
                {data.aiAvailable
                  ? `AI-generated summaries • ${data.total} alert${data.total !== 1 ? "s" : ""}`
                  : `${data.total} alert${data.total !== 1 ? "s" : ""} (AI not configured)`}
              </p>
              {data.generatedAt && (
                <p className="text-[10px] text-slate-400">
                  Updated {formatRelative(data.generatedAt)}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <p className="text-[10px] text-amber-700">
                <strong>Note:</strong> Alerts are derived from citizen-reported complaints. Single reports are labelled as citizen-reported and do not represent official confirmations.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

