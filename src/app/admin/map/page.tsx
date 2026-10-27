"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  ShieldAlert, 
  Layers, 
  Flame, 
  Filter, 
  RotateCw, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import type { Complaint } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import { isComplaintOverdue } from "@/lib/sla";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("ALL");
  const [showHotspots, setShowHotspots] = useState<boolean>(true);

  const fetchComplaints = useCallback(async () => {
    setIsRefreshing(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    setComplaints(data || []);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Filter complaints based on criteria
  const filteredComplaints = useMemo(() => {
    const now = new Date();

    return complaints.filter((c) => {
      // Category filter
      if (selectedCategory !== "ALL" && c.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus === "UNRESOLVED") {
        if (c.status === "RESOLVED") return false;
      } else if (selectedStatus !== "ALL" && c.status !== selectedStatus) {
        return false;
      }

      // Date range & SLA filter
      if (selectedDateRange === "7_DAYS") {
        const created = new Date(c.created_at);
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (selectedDateRange === "30_DAYS") {
        const created = new Date(c.created_at);
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      } else if (selectedDateRange === "OVERDUE") {
        if (!isComplaintOverdue(c)) return false;
      }

      return true;
    });
  }, [complaints, selectedCategory, selectedStatus, selectedDateRange]);

  const complaintsWithLocation = complaints.filter(
    (c) => c.latitude && c.longitude && !c.is_sensitive
  );
  const sensitiveHiddenCount = complaints.filter((c) => c.is_sensitive).length;
  const overdueCount = complaints.filter((c) => isComplaintOverdue(c)).length;

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
              स्मार्ट नागरिक हीटमैप एवं घटना मानचित्र <span className="text-slate-400 font-normal">|</span> Smart Civic Heatmap
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              नगर निगम वार्डों में वास्तविक समय पर नागरिक शिकायतों का उपग्रह व मानचित्र आधारित स्थानिक दृश्य, घनत्व क्लस्टरिंग और एसएलए ट्रैकिंग
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchComplaints}
              disabled={isRefreshing}
              className="h-8 gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              ताज़ा करें
            </Button>
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
            <Layers className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">स्थानिक पिन</p>
              <p className="text-sm font-bold text-blue-900">{complaintsWithLocation.length} मैप पर सक्रिय</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
            <Flame className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">हॉटस्पॉट मोड</p>
              <p className="text-sm font-bold text-amber-900">
                {showHotspots ? "सक्रिय (450m क्लस्टर)" : "निष्क्रिय"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50/60 border border-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">SLA उल्लंघन</p>
              <p className="text-sm font-bold text-red-900">{overdueCount} समय सीमा पार</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
            <ShieldAlert className="h-4 w-4 text-pink-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">गोपनीय सुरक्षित</p>
              <p className="text-sm font-bold text-pink-900">{sensitiveHiddenCount} स्थान सुरक्षित</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Filter className="h-4 w-4 text-blue-600" />
              <span>मानचित्र फ़िल्टर (GIS Filter Controls):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Select */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">सभी श्रेणियां (All Categories)</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Status Select */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">सभी स्थितियां (All Status)</option>
                <option value="UNRESOLVED">अनसुलझी शिकायतें (Unresolved)</option>
                <option value="SUBMITTED">प्रस्तुत (Submitted)</option>
                <option value="ASSIGNED">आवंटित (Assigned)</option>
                <option value="IN_PROGRESS">प्रगति पर (In Progress)</option>
                <option value="ESCALATED">एस्केलेटेड (Escalated)</option>
                <option value="RESOLVED">सुलझी हुई (Resolved)</option>
              </select>

              {/* Date / SLA Select */}
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">समय: सभी (All Time)</option>
                <option value="7_DAYS">पिछले 7 दिन (Past 7 Days)</option>
                <option value="30_DAYS">पिछले 30 दिन (Past 30 Days)</option>
                <option value="OVERDUE">केवल SLA उल्लंघन (Overdue Cases)</option>
              </select>

              {/* Hotspots Toggle */}
              <Button
                type="button"
                variant={showHotspots ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHotspots((prev) => !prev)}
                className={`h-8 gap-1.5 text-xs font-semibold ${
                  showHotspots
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "text-slate-600 bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <Flame className={`h-3.5 w-3.5 ${showHotspots ? "fill-white text-white" : "text-amber-600"}`} />
                {showHotspots ? "हॉटस्पॉट चालू (Hotspots On)" : "हॉटस्पॉट बंद (Hotspots Off)"}
              </Button>

              {(selectedCategory !== "ALL" || selectedStatus !== "ALL" || selectedDateRange !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setSelectedStatus("ALL");
                    setSelectedDateRange("ALL");
                  }}
                  className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                >
                  रीसेट करें
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Rendering Container */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              शहरी परिचालन मानचित्र <span className="text-xs text-slate-500 font-normal">| City Operational GIS</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              मार्कर पर क्लिक करके शिकायत संदर्भ, लाइव स्थिति, SLA समय और विवरण देखें।
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-semibold bg-slate-50 border-slate-200">
            प्रदर्शित: {filteredComplaints.filter((c) => c.latitude && c.longitude && !c.is_sensitive).length} पिन
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <Skeleton className="w-full h-[520px] rounded-xl" />
          ) : (
            <DynamicLeafletMap complaints={filteredComplaints} showHotspots={showHotspots} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
