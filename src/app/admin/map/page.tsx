"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ShieldAlert, Layers } from "lucide-react";
import type { Complaint } from "@/types";

const DynamicLeafletMap = dynamic(
  () => import("@/components/map/leaflet-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
        <MapPin className="h-8 w-8 animate-bounce text-blue-500" />
        <span className="text-sm font-medium">Loading interactive map...</span>
      </div>
    ),
  }
);

export default function AdminMapPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      setComplaints(data || []);
      setIsLoading(false);
    };
    fetchComplaints();
  }, []);

  const complaintsWithLocation = complaints.filter(
    (c) => c.latitude && c.longitude && !c.is_sensitive
  );
  const sensitiveHiddenCount = complaints.filter((c) => c.is_sensitive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Geographic Heatmap & Incidents</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time geospatial visualization of reported civic issues across city wards
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          <span className="flex items-center gap-1 font-medium text-slate-900">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            {complaintsWithLocation.length} Mapped Pins
          </span>
          {sensitiveHiddenCount > 0 && (
            <span className="flex items-center gap-1 text-pink-600 font-medium">
              <ShieldAlert className="h-3.5 w-3.5" />
              {sensitiveHiddenCount} Sensitive Restricted
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">City Operational Map</CardTitle>
          <CardDescription>
            Click markers to inspect complaint references, live status, and jump straight to resolution assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[520px] rounded-xl" />
          ) : (
            <DynamicLeafletMap complaints={complaints} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
