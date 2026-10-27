"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Complaint } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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

interface LeafletMapProps {
  complaints: Complaint[];
}

export default function LeafletMap({ complaints }: LeafletMapProps) {
  // Default center (e.g. New Delhi demo center: 28.6139, 77.2090)
  const defaultPos: [number, number] = [28.6139, 77.209];

  // Pick first valid complaint location if available
  const firstWithCoords = complaints.find((c) => c.latitude && c.longitude);
  const centerPos: [number, number] = firstWithCoords
    ? [firstWithCoords.latitude!, firstWithCoords.longitude!]
    : defaultPos;

  return (
    <div className="w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
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
        {complaints
          .filter((c) => c.latitude && c.longitude && !c.is_sensitive)
          .map((c) => (
            <Marker
              key={c.id}
              position={[c.latitude!, c.longitude!]}
              icon={customIcon}
            >
              <Popup className="custom-popup">
                <div className="p-1 space-y-1.5 min-w-[180px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">{c.tracking_id}</span>
                    <StatusBadge status={c.status} className="text-[10px] px-1 py-0" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</p>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{c.description}</p>
                  {c.address && <p className="text-[10px] text-slate-400 truncate">{c.address}</p>}
                  <div className="pt-1 border-t border-slate-100 flex justify-end">
                    <Link
                      href={`/admin/complaints/${c.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                    >
                      View details <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
