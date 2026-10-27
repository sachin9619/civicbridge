"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Complaint, Priority } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { SLABadge } from "@/components/ui/sla-badge";
import Link from "next/link";
import { ArrowUpRight, Flame, Clock, AlertTriangle, Layers, MapPin } from "lucide-react";
import { calculateDistanceMeters } from "@/lib/ai/gemini";

// Fix standard Leaflet icon paths in React
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const urgentIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LeafletMapProps {
  complaints: Complaint[];
  showHotspots?: boolean;
}

interface HotspotCluster {
  id: string;
  lat: number;
  lng: number;
  complaints: Complaint[];
  count: number;
  highestPriority: Priority;
  oldestAgeDays: number;
}

export default function LeafletMap({ complaints, showHotspots = true }: LeafletMapProps) {
  // Default center (New Delhi / National Demo Center)
  const defaultPos: [number, number] = [28.6139, 77.209];

  const validComplaints = useMemo(
    () => complaints.filter((c) => c.latitude && c.longitude && !c.is_sensitive),
    [complaints]
  );

  const centerPos: [number, number] = useMemo(() => {
    if (validComplaints.length > 0) {
      return [validComplaints[0].latitude!, validComplaints[0].longitude!];
    }
    return defaultPos;
  }, [validComplaints]);

  // Compute Unresolved Civic Hotspots (clustering complaints within 450 meters)
  const hotspots: HotspotCluster[] = useMemo(() => {
    if (!showHotspots) return [];

    const unresolved = validComplaints.filter(
      (c) => !["RESOLVED", "REJECTED"].includes(c.status)
    );

    const clusters: HotspotCluster[] = [];
    const visited = new Set<string>();

    for (const comp of unresolved) {
      if (visited.has(comp.id)) continue;

      const group: Complaint[] = [comp];
      visited.add(comp.id);

      for (const other of unresolved) {
        if (visited.has(other.id)) continue;
        const dist = calculateDistanceMeters(
          comp.latitude!,
          comp.longitude!,
          other.latitude!,
          other.longitude!
        );

        // Within 450 meters = same hotspot zone
        if (dist <= 450) {
          group.push(other);
          visited.add(other.id);
        }
      }

      // Identify priority and age
      let highestPriority: Priority = "LOW";
      let oldestDays = 0;
      const priorityWeights: Record<Priority, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      let sumLat = 0;
      let sumLng = 0;

      for (const item of group) {
        sumLat += item.latitude!;
        sumLng += item.longitude!;

        if (priorityWeights[item.priority] > priorityWeights[highestPriority]) {
          highestPriority = item.priority;
        }

        const ageDays = Math.floor(
          (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (ageDays > oldestDays) oldestDays = ageDays;
      }

      clusters.push({
        id: `hotspot-${comp.id}`,
        lat: sumLat / group.length,
        lng: sumLng / group.length,
        complaints: group,
        count: group.length,
        highestPriority,
        oldestAgeDays: oldestDays,
      });
    }

    // Filter clusters with >= 2 complaints OR 1 urgent complaint
    return clusters.filter((cl) => cl.count >= 2 || cl.highestPriority === "URGENT");
  }, [validComplaints, showHotspots]);

  return (
    <div className="w-full h-[540px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={centerPos}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hotspot Circles */}
        {hotspots.map((hs) => {
          const isUrgent = hs.highestPriority === "URGENT" || hs.highestPriority === "HIGH";
          const color = isUrgent ? "#dc2626" : "#ea580c";
          const fillColor = isUrgent ? "#ef4444" : "#f97316";
          const radius = Math.min(160 + hs.count * 45, 380);

          return (
            <Circle
              key={hs.id}
              center={[hs.lat, hs.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor,
                fillOpacity: 0.22,
                weight: 2,
                dashArray: isUrgent ? "4, 6" : undefined,
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 space-y-2 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-red-700">
                      <Flame className="h-3.5 w-3.5 fill-red-600 text-red-600" />
                      नागरिक हॉटस्पॉट | Civic Hotspot
                    </span>
                    <Badge variant={isUrgent ? "error" : "warning"} className="text-[10px] font-bold">
                      {hs.highestPriority}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">अनसुलझी शिकायतें</span>
                      <span className="font-bold text-slate-900 font-mono text-xs">{hs.count} Active Tickets</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">अधिकतम अवधि</span>
                      <span className="font-bold text-amber-700 font-mono text-xs">{hs.oldestAgeDays} Days Old</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    <p className="text-[10px] uppercase font-bold text-slate-400">हॉटस्पॉट में सम्मिलित:</p>
                    {hs.complaints.map((c) => (
                      <Link
                        key={c.id}
                        href={`/admin/complaints/${c.id}`}
                        className="flex items-center justify-between text-[11px] hover:bg-slate-100 p-1 rounded transition-colors group"
                      >
                        <span className="font-mono font-semibold text-blue-700 group-hover:underline">
                          {c.tracking_id}
                        </span>
                        <StatusBadge status={c.status} className="text-[9px] px-1 py-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Individual Complaint Markers */}
        {validComplaints.map((c) => {
          const isUrgent = c.priority === "URGENT";
          return (
            <Marker
              key={c.id}
              position={[c.latitude!, c.longitude!]}
              icon={isUrgent ? urgentIcon : customIcon}
            >
              <Popup className="custom-popup">
                <div className="p-1 space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {c.tracking_id}
                    </span>
                    <StatusBadge status={c.status} className="text-[10px] px-1 py-0" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{c.description}</p>
                  </div>

                  <div className="pt-1 border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-medium">{c.category.replace(/_/g, " ")}</span>
                      <SLABadge
                        createdAt={c.created_at}
                        deadline={c.deadline}
                        status={c.status}
                        resolvedAt={c.resolved_at}
                        showIcon={false}
                        className="text-[9px] py-0 px-1"
                      />
                    </div>
                    {c.address && (
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        {c.address}
                      </p>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                    <Link
                      href={`/admin/complaints/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      निस्तारण देखें (Details) <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
