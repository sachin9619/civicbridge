export const APP_NAME = "CivicBridge";
export const APP_TAGLINE = "One City. One Platform. Accountable Action.";
export const APP_DESCRIPTION =
  "Bridge the gap between citizens reporting civic issues and government departments resolving them. Report problems, track progress, and hold your city accountable.";

export const CATEGORIES = [
  { value: "GARBAGE_WASTE", label: "Garbage & Waste", icon: "Trash2", color: "text-green-600" },
  { value: "POTHOLE_ROADS", label: "Potholes & Roads", icon: "Construction", color: "text-amber-600" },
  { value: "STREETLIGHTS", label: "Streetlights", icon: "Lightbulb", color: "text-yellow-500" },
  { value: "DRAINAGE_SEWAGE", label: "Drainage & Sewage", icon: "Waves", color: "text-blue-600" },
  { value: "WATER_SUPPLY", label: "Water Supply", icon: "Droplets", color: "text-cyan-600" },
  { value: "WOMEN_SAFETY", label: "Women's Safety", icon: "Shield", color: "text-pink-600" },
  { value: "PUBLIC_INFRASTRUCTURE", label: "Public Infrastructure", icon: "Building2", color: "text-slate-600" },
  { value: "OTHER", label: "Other Issues", icon: "CircleDot", color: "text-gray-600" },
] as const;

export const PRIORITIES = [
  { value: "LOW", label: "Low", color: "text-slate-500" },
  { value: "MEDIUM", label: "Medium", color: "text-blue-500" },
  { value: "HIGH", label: "High", color: "text-amber-500" },
  { value: "URGENT", label: "Urgent", color: "text-red-500" },
] as const;
