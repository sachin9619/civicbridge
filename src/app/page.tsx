"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Building2, Search, ArrowRight, Shield, MapPin, Clock, CheckCircle2,
  Trash2, Construction, Lightbulb, Waves, Droplets, ChevronRight,
  Camera, FileText, Users, Eye, HelpCircle, Phone, Sparkles,
  Calendar, Globe, ShieldAlert, ExternalLink, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [searchTrackingId, setSearchTrackingId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "xlarge">("normal");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTrackingId.trim();
    if (query) {
      router.push(`/dashboard/complaints?search=${encodeURIComponent(query)}`);
    } else {
      router.push("/dashboard/report");
    }
  };

  return (
    <div className={`flex flex-col min-h-screen bg-[#fcfcfd] text-slate-800 font-sans ${
      fontSizeLevel === "large" ? "text-base" : fontSizeLevel === "xlarge" ? "text-lg" : "text-sm"
    }`}>
      {/* 1. TOP TRI-COLOR ACCENT STRIPE */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      {/* 2. GOVERNMENT UTILITY / ACCESSIBILITY BAR */}
      <div className="bg-[#1f2937] text-slate-200 text-xs py-1.5 px-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide">
            <span className="text-amber-400 font-bold">भारत सरकार</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-200">Government of India</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-slate-300">Ministry of Housing & Urban Affairs (MoHUA)</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <a href="#main-content" className="hover:underline text-slate-300 hover:text-white">
              Skip to main content
            </a>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-slate-600">|</span>
            {/* Font Sizer */}
            <div className="flex items-center gap-1 font-mono">
              <button
                onClick={() => setFontSizeLevel("normal")}
                className={`px-1 rounded ${fontSizeLevel === "normal" ? "bg-slate-700 text-white font-bold" : "text-slate-400"}`}
                title="Default text size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSizeLevel("large")}
                className={`px-1 rounded ${fontSizeLevel === "large" ? "bg-slate-700 text-white font-bold" : "text-slate-400"}`}
                title="Larger text size"
              >
                A
              </button>
              <button
                onClick={() => setFontSizeLevel("xlarge")}
                className={`px-1 rounded ${fontSizeLevel === "xlarge" ? "bg-slate-700 text-white font-bold" : "text-slate-400"}`}
                title="Extra large text size"
              >
                A+
              </button>
            </div>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-amber-300 cursor-pointer hover:underline">
              अ / A
            </span>
            <span className="text-slate-600">|</span>
            {/* Tiranga Flag Mini Badge */}
            <div className="flex flex-col w-5 h-3.5 border border-slate-500 rounded-xs overflow-hidden shadow-xs">
              <div className="h-1/3 bg-[#FF9933]" />
              <div className="h-1/3 bg-white flex items-center justify-center">
                <div className="h-1 w-1 rounded-full bg-[#000080]" />
              </div>
              <div className="h-1/3 bg-[#138808]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY GOVERNMENT HEADER WITH NATIONAL EMBLEM & SEARCH */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* National Emblem & Title */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {/* Ashoka Stambh SVG */}
            <div className="h-14 w-12 flex flex-col items-center justify-center shrink-0">
              <svg viewBox="0 0 100 120" className="h-full w-full text-amber-800" fill="currentColor">
                {/* Simplified Lion Capital Motif */}
                <path d="M50 5 C40 5 35 15 35 25 C35 30 38 35 42 38 C35 40 30 46 30 55 C30 65 38 72 45 74 L45 88 L30 92 L30 98 L70 98 L70 92 L55 88 L55 74 C62 72 70 65 70 55 C70 46 65 40 58 38 C62 35 65 30 65 25 C65 15 60 5 50 5 Z M50 12 C55 12 58 17 58 24 C58 30 54 34 50 34 C46 34 42 30 42 24 C42 17 45 12 50 12 Z M50 78 C54 78 57 81 57 85 C57 89 54 92 50 92 C46 92 43 89 43 85 C43 81 46 78 50 78 Z" />
                <rect x="20" y="102" width="60" height="4" rx="1" fill="#8B4513" />
                <text x="50" y="116" fontSize="9" textAnchor="middle" fontWeight="bold" fill="#8B4513" fontFamily="serif">सत्यमेव जयते</text>
              </svg>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-black tracking-tight text-[#002d62]">
                  CivicBridge
                </span>
                <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                  .gov.in
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700 leading-tight">
                National Civic Grievance & Urban Governance Platform
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                राष्ट्रीय नागरिक सेवा एवं नगर प्रशासन पोर्टल
              </p>
            </div>
          </Link>

          {/* Integrated Search Box (Reference Image style: Input + Category Select + Red Search Button) */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl w-full">
            <div className="flex items-center rounded-lg border-2 border-slate-300 bg-white overflow-hidden shadow-xs focus-within:border-blue-700 transition-colors">
              <div className="pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search by Tracking ID, Ward, Scheme, Category..."
                value={searchTrackingId}
                onChange={(e) => setSearchTrackingId(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm text-slate-900 focus:outline-none bg-transparent"
              />
              <div className="hidden sm:block border-l border-slate-200 px-2 py-1 bg-slate-50">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs text-slate-700 bg-transparent focus:outline-none cursor-pointer font-medium"
                >
                  <option value="ALL">All Categories</option>
                  <option value="POTHOLE_ROADS">Potholes & Roads</option>
                  <option value="GARBAGE_WASTE">Sanitation & Waste</option>
                  <option value="WATER_SUPPLY">Water Supply</option>
                  <option value="STREETLIGHTS">Streetlights</option>
                  <option value="DRAINAGE_SEWAGE">Drainage</option>
                  <option value="WOMEN_SAFETY">Women&apos;s Safety</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-5 py-2.5 text-xs md:text-sm font-bold tracking-wide transition-colors shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Login / Portals Access Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/wards">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-400 bg-amber-50/70 text-amber-900 hover:bg-amber-100 font-bold text-xs gap-1 hidden sm:flex shadow-xs"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                स्वच्छ रैंकिंग (Scores)
              </Button>
            </Link>

            {user ? (
              <>
                <Link
                  href={
                    profile?.role === "admin"
                      ? "/admin"
                      : profile?.role === "employee"
                      ? "/employee"
                      : "/dashboard"
                  }
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs shadow-xs"
                  >
                    डैशबोर्ड | Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/report">
                  <Button
                    size="sm"
                    className="bg-[#002d62] hover:bg-[#001d42] text-white font-bold text-xs shadow-xs"
                  >
                    शिकायत दर्ज करें (Lodge)
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                  >
                    Officer / Citizen Sign In
                  </Button>
                </Link>
                <Link href="/login?redirect=/dashboard/report">
                  <Button
                    size="sm"
                    className="bg-[#002d62] hover:bg-[#001d42] text-white font-semibold text-xs shadow-xs"
                  >
                    Lodge Grievance
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 4. NATIONAL QUOTE & DIGNITARY BANNER (Reference Image 2) */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#002d62] text-white py-8 px-4 relative overflow-hidden">
        {/* Subtle Watermark Map / Ashoka Chakra in background */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <Building2 className="h-96 w-96 text-white" />
        </div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Framed Dignitary Avatar with Tricolor Ring */}
          <div className="relative shrink-0">
            <div className="h-28 w-28 md:h-32 md:md:w-32 rounded-full p-1 bg-gradient-to-tr from-[#FF9933] via-white to-[#138808] shadow-xl">
              <div className="h-full w-full rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-white">
                {/* Dignitary vector illustration */}
                <div className="flex flex-col items-center justify-center text-slate-700">
                  <div className="h-10 w-10 rounded-full bg-slate-300 mb-1" />
                  <div className="h-10 w-16 rounded-t-full bg-slate-400" />
                </div>
              </div>
            </div>
            <span className="absolute bottom-0 right-0 bg-[#d32f2f] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white">
              GOV.IN
            </span>
          </div>

          {/* Official Quote Box */}
          <div className="bg-white text-slate-800 rounded-2xl p-5 md:p-6 shadow-xl border border-slate-200 flex-1 relative">
            <div className="flex items-start gap-2">
              <span className="text-3xl font-serif text-[#d32f2f] leading-none select-none">&ldquo;</span>
              <p className="text-sm md:text-base font-medium text-slate-800 leading-relaxed italic">
                India&apos;s Digital Public Infrastructure has demonstrated how technology can expand opportunity,
                improve governance, boost municipal transparency and deliver verified civic services for hundreds of
                millions of citizens in every urban ward.
              </p>
              <span className="text-3xl font-serif text-[#d32f2f] leading-none select-none self-end">&rdquo;</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                National Urban Governance & Digital Infrastructure Mission
              </span>
              <span className="text-[11px] font-medium text-blue-800">
                Viksit Bharat 2047 Initiative
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. NATIONAL STATS FLOATING RIBBON (Reference Image 2) */}
      <div id="main-content" className="max-w-6xl mx-auto px-4 -mt-6 relative z-20">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-center">
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">13,553+</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Online Grievances</p>
              <p className="text-[10px] text-emerald-600 font-medium">Resolved & Verified</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">5,731</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Urban Wards</p>
              <p className="text-[10px] text-blue-600 font-medium">Mapped by GPS</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">2,365</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Field Workers</p>
              <p className="text-[10px] text-amber-600 font-medium">Active On-Duty</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">94.8%</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Resolution Rate</p>
              <p className="text-[10px] text-emerald-600 font-medium">Citizen Certified</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">1,207</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Hotspots Cleared</p>
              <p className="text-[10px] text-purple-600 font-medium">AI Audited Proof</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">18</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Departments</p>
              <p className="text-[10px] text-slate-500 font-medium">Integrated Real-time</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. "ONLINE SERVICES" SOLID RED SECTION (Exact replica of Reference Image 2) */}
      <section className="bg-[#d32f2f] text-white py-12 px-4 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Block: Online Services Header + 4 Outline Stat Badges */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight inline-block border-b-4 border-white pb-1">
                  Online Services
                </h2>
                <p className="text-sm text-red-100 mt-2 font-medium">
                  Direct digital citizen services for municipal grievances and swift administrative action.
                </p>
              </div>

              {/* 4 Transparent White Bordered Boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-white/40 rounded-xl p-3.5 bg-white/5 backdrop-blur-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-white" />
                    <span className="text-lg font-bold text-white">1,097+</span>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-100">
                    Ward Centers
                  </p>
                  <p className="text-[10px] text-white/70">Central & State</p>
                </div>

                <div className="border border-white/40 rounded-xl p-3.5 bg-white/5 backdrop-blur-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-lg font-bold text-white">12,456+</span>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-100">
                    Action Taken
                  </p>
                  <p className="text-[10px] text-white/70">Verified by Evidence</p>
                </div>

                <div className="border border-white/40 rounded-xl p-3.5 bg-white/5 backdrop-blur-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-white" />
                    <span className="text-lg font-bold text-white">33</span>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-100">
                    Fast-Track AI
                  </p>
                  <p className="text-[10px] text-white/70">Auto-Routing Rules</p>
                </div>

                <div className="border border-white/40 rounded-xl p-3.5 bg-white/5 backdrop-blur-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-white" />
                    <span className="text-lg font-bold text-white">18</span>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-100">
                    Municipal Depts
                  </p>
                  <p className="text-[10px] text-white/70">PWD, Jal, Waste</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-red-100 font-medium">
                  Avail online Services & Save time
                </span>
                <Link href="/dashboard/report">
                  <button className="bg-white text-[#d32f2f] hover:bg-red-50 text-xs font-bold px-4 py-2 rounded-full shadow-md transition-colors">
                    View All Services
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Block: 3 Service Feature Cards (Image 2 style) */}
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-4">
              {/* Service Card 1 */}
              <div className="bg-white rounded-xl text-slate-800 p-4 shadow-md flex flex-col justify-between hover:shadow-lg transition-all border border-slate-100">
                <div className="space-y-3">
                  <div className="h-28 w-full bg-blue-50 rounded-lg flex flex-col items-center justify-center p-3 text-center border border-blue-100">
                    <Camera className="h-8 w-8 text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-blue-900">Live Camera Snap</span>
                    <span className="text-[10px] text-slate-500">Geo-tagged photo upload</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Lodge New Civic Complaint with GPS
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Report potholes, waste dumps, or water leakages directly from the site.
                  </p>
                </div>
                <Link href="/dashboard/report" className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#d32f2f] hover:text-[#b71c1c]">
                  <span>Report Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Service Card 2 */}
              <div className="bg-white rounded-xl text-slate-800 p-4 shadow-md flex flex-col justify-between hover:shadow-lg transition-all border border-slate-100">
                <div className="space-y-3">
                  <div className="h-28 w-full bg-emerald-50 rounded-lg flex flex-col items-center justify-center p-3 text-center border border-emerald-100">
                    <Clock className="h-8 w-8 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-emerald-900">Real-Time Tracking</span>
                    <span className="text-[10px] text-slate-500">Live SLA & Status</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Track Grievance Status by Tracking ID
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Monitor officer assignment, ground worker movement, and estimated resolution time.
                  </p>
                </div>
                <Link href="/dashboard/complaints" className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#d32f2f] hover:text-[#b71c1c]">
                  <span>Track Status</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Service Card 3 */}
              <div className="bg-white rounded-xl text-slate-800 p-4 shadow-md flex flex-col justify-between hover:shadow-lg transition-all border border-slate-100">
                <div className="space-y-3">
                  <div className="h-28 w-full bg-purple-50 rounded-lg flex flex-col items-center justify-center p-3 text-center border border-purple-100">
                    <Sparkles className="h-8 w-8 text-purple-600 mb-1" />
                    <span className="text-xs font-bold text-purple-900">AI Quality Auditor</span>
                    <span className="text-[10px] text-slate-500">Before vs After Proof</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    AI Verified Work Completion
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Computer vision audits field staff resolution photos before complaints are closed.
                  </p>
                </div>
                <Link href="/login" className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#d32f2f] hover:text-[#b71c1c]">
                  <span>Staff Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. "MYGOV CONNECT / CIVICCONNECT" CITIZEN ACTION (Reference Image 1) */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header matching Image 1 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              <span className="border-b-4 border-[#d32f2f] pb-1">CivicConnect</span> Engagement
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-2 font-medium">
              Participate in nation-building and city cleanliness activities
            </p>
          </div>

          {/* 3 Large Contest & Initiative Banners in Red Box (Image 1 style) */}
          <div className="bg-[#d32f2f] rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Campaign 1 */}
              <div className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col justify-between">
                <div className="p-5 space-y-3">
                  <div className="h-36 w-full rounded-lg bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-950 p-4 text-white flex flex-col justify-between relative overflow-hidden">
                    <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded self-start">
                      Ministry of Housing & Urban Affairs
                    </span>
                    <div>
                      <h4 className="text-lg font-black tracking-tight leading-tight">
                        SWACHH SHAHAR 2026
                      </h4>
                      <p className="text-[11px] text-blue-200">Yuva Civic Action Drive</p>
                    </div>
                  </div>
                  <span className="inline-block bg-[#d32f2f] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Do
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Community Waste & Dump Spotting Challenge
                  </h3>
                  <p className="text-xs text-slate-500">
                    Snap and submit photo evidence of overflowing waste to trigger instant sanitation truck dispatch.
                  </p>
                </div>
                <div className="px-5 pb-5 pt-0">
                  <Link href="/dashboard/report">
                    <Button size="sm" variant="outline" className="w-full text-xs font-semibold text-[#d32f2f] border-red-200 hover:bg-red-50">
                      Participate Now
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Campaign 2 */}
              <div className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col justify-between">
                <div className="p-5 space-y-3">
                  <div className="h-36 w-full rounded-lg bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 p-4 text-white flex flex-col justify-between relative overflow-hidden">
                    <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded self-start">
                      Public Works Department (PWD)
                    </span>
                    <div>
                      <h4 className="text-lg font-black tracking-tight leading-tight">
                        POTHOLE-FREE WARD
                      </h4>
                      <p className="text-[11px] text-emerald-200">Monsoon Resilience Campaign</p>
                    </div>
                  </div>
                  <span className="inline-block bg-[#d32f2f] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Do
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Road Safety & Pavement Inspection Initiative
                  </h3>
                  <p className="text-xs text-slate-500">
                    Help municipal engineers identify cracked bitumen and damaged drainage covers before rain.
                  </p>
                </div>
                <div className="px-5 pb-5 pt-0">
                  <Link href="/dashboard/report">
                    <Button size="sm" variant="outline" className="w-full text-xs font-semibold text-[#d32f2f] border-red-200 hover:bg-red-50">
                      Submit Ward Report
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Campaign 3 */}
              <div className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col justify-between">
                <div className="p-5 space-y-3">
                  <div className="h-36 w-full rounded-lg bg-gradient-to-br from-amber-900 via-orange-800 to-amber-950 p-4 text-white flex flex-col justify-between relative overflow-hidden">
                    <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded self-start">
                      PM GatiShakti National Master Plan
                    </span>
                    <div>
                      <h4 className="text-lg font-black tracking-tight leading-tight">
                        VIKSIT NAGAR 2047
                      </h4>
                      <p className="text-[11px] text-orange-200">Urban Mobility & Infrastructure</p>
                    </div>
                  </div>
                  <span className="inline-block bg-[#b71c1c] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Discuss
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Citizen Feedback on Urban Master Drainage Plan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review upcoming storm-water pipeline plans and suggest improvements for waterlogging prone areas.
                  </p>
                </div>
                <div className="px-5 pb-5 pt-0">
                  <Link href="/login">
                    <Button size="sm" variant="outline" className="w-full text-xs font-semibold text-[#d32f2f] border-red-200 hover:bg-red-50">
                      Share Feedback
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* View All Pill Button (Image 1 style) */}
            <div className="text-center mt-8">
              <Link href="/dashboard">
                <button className="bg-white hover:bg-slate-100 text-[#d32f2f] font-bold text-xs px-6 py-2.5 rounded-full shadow-md transition-all hover:scale-105">
                  View All Citizen Initiatives
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CITIZEN CIVIC CATEGORIES (Indian Municipal Directory Style) */}
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded">
                MUNICIPAL DIRECTORY
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                Civic Grievance Departments
              </h2>
              <p className="text-xs text-slate-500">
                Direct statutory complaint handling with assigned municipal ward officers.
              </p>
            </div>
            <Link href="/dashboard/report">
              <Button size="sm" variant="primary" className="bg-[#002d62] text-xs font-semibold gap-1.5">
                Report Any Civic Issue <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: Construction, title: "Potholes & Roads", hindi: "सड़क एवं गड्ढे", desc: "PWD road repair, uneven bitumen, broken pavements." },
              { icon: Trash2, title: "Sanitation & Waste", hindi: "ठोस अपशिष्ट प्रबंधन", desc: "Garbage overflow, uncleaned bins, door-to-door collection." },
              { icon: Droplets, title: "Water Supply (Jal)", hindi: "पेयजल आपूर्ति", desc: "Pipeline leakages, contamination, low pressure." },
              { icon: Lightbulb, title: "Streetlights & Poles", hindi: "मार्ग प्रकाश व्यवस्था", desc: "Faulty LED lights, dark stretches, loose electric cables." },
              { icon: Waves, title: "Drainage & Sewage", hindi: "जल निकासी एवं सीवर", desc: "Blocked stormwater drains, open manholes, sewage backflow." },
              { icon: ShieldAlert, title: "Women's Safety (Nirbhaya)", hindi: "महिला सुरक्षा", desc: "Dark spots, helpline linkage, strictly confidential handling." },
              { icon: Building2, title: "Public Infrastructure", hindi: "सार्वजनिक निर्माण", desc: "Public parks, bus shelters, municipal bridges." },
              { icon: Sparkles, title: "Smart City AI Help", hindi: "एआई नागरिक सहूलियत", desc: "Instant duplicate detection, auto-categorization." },
            ].map((cat) => (
              <Link
                key={cat.title}
                href="/dashboard/report"
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-[#002d62] group-hover:text-white transition-colors">
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] font-medium text-amber-700">
                    {cat.hindi}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-700">
                  <span>Lodge Grievance</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* 10. OFFICIAL GOVERNMENT FOOTER (NIC / Digital India / Ministry Style) */}
      <footer className="bg-[#111827] text-slate-300 text-xs pt-12 pb-6 border-t-4 border-[#FF9933]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            {/* Column 1: Ministry Info */}
            <div className="space-y-3 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Building2 className="h-5 w-5 text-amber-400" />
                <span>CivicBridge Portal</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                An Official Digital Public Infrastructure platform under the Ministry of Housing and Urban Affairs (MoHUA),
                Government of India, facilitating transparent grievance redressal across urban local bodies.
              </p>
              <div className="pt-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">National Helpline:</span> 1800-11-2026 (Toll-Free)
              </div>
            </div>

            {/* Column 2: Government Links */}
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[11px] mb-3 border-b border-slate-700 pb-1">
                Government Portals
              </p>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">National Portal of India <ExternalLink className="h-2.5 w-2.5" /></a></li>
                <li><a href="https://mygov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">MyGov Citizen Portal <ExternalLink className="h-2.5 w-2.5" /></a></li>
                <li><a href="https://mohua.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">MoHUA Government <ExternalLink className="h-2.5 w-2.5" /></a></li>
                <li><a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">Open Government Data (OGD) <ExternalLink className="h-2.5 w-2.5" /></a></li>
              </ul>
            </div>

            {/* Column 3: Citizen Services */}
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[11px] mb-3 border-b border-slate-700 pb-1">
                Citizen Services
              </p>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><Link href="/dashboard/report" className="hover:text-white">Lodge Public Grievance</Link></li>
                <li><Link href="/dashboard/complaints" className="hover:text-white">Track Grievance Status</Link></li>
                <li><Link href="/login" className="hover:text-white">Officer / Staff Login</Link></li>
                <li><Link href="/register" className="hover:text-white">Citizen Account Registration</Link></li>
              </ul>
            </div>

            {/* Column 4: Policies & Compliance */}
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[11px] mb-3 border-b border-slate-700 pb-1">
                Policies & Terms
              </p>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li className="hover:text-white cursor-pointer">Website Policies</li>
                <li className="hover:text-white cursor-pointer">Right to Information (RTI)</li>
                <li className="hover:text-white cursor-pointer">Citizen&apos;s Charter</li>
                <li className="hover:text-white cursor-pointer">Security & Privacy Statement</li>
                <li className="hover:text-white cursor-pointer">Accessibility Statement</li>
              </ul>
            </div>
          </div>

          {/* Bottom Tricolor Band & NIC Credit (Reference Indian Gov Style) */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[11px] text-slate-400">
            <div>
              <p className="font-medium text-slate-300">
                Site Designed, Developed and Hosted by National Informatics Centre (NIC).
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Content Owned, Maintained and Updated by Ministry of Housing and Urban Affairs, Government of India.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                Last Reviewed: 27 Oct 2026
              </span>
              <span className="text-emerald-400 font-bold">● System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
