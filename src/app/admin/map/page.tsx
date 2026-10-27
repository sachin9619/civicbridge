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
      {/* Official Government GIS Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider text-[#d32f2f] uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                राष्ट्रीय भू-स्थानिक पोर्टल • GIS GRID
              </span>
              <span className="text-[11px] font-medium text-slate-500">वार्ड स्थानिक विश्लेषण</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              भू-स्थानिक हीटमैप एवं घटना मानचित्र <span className="text-slate-400 font-normal">|</span> GIS Operations Grid
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              नगर निगम वार्डों में वास्तविक समय पर नागरिक समस्याओं का उपग्रह व मानचित्र आधारित स्थानिक दृश्य
            </p>
          </div>
          <div className="flex items-center gap-2.5 text-xs bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg shadow-xs shrink-0">
            <span className="flex items-center gap-1.5 font-bold text-[#002B49]">
              <Layers className="h-4 w-4 text-blue-600" />
              {complaintsWithLocation.length} सक्रिय पिन
            </span>
            {sensitiveHiddenCount > 0 && (
              <span className="flex items-center gap-1 text-pink-700 font-semibold border-l border-slate-300 pl-2.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                {sensitiveHiddenCount} गोपनीय
              </span>
            )}
          </div>
        </div>
      </div>

      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">
            शहरी परिचालन मानचित्र <span className="text-xs text-slate-500 font-normal">| City Operational GIS</span>
          </CardTitle>
          <CardDescription>
            Click markers to inspect complaint references, live status, and jump straight to resolution assignment.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
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
