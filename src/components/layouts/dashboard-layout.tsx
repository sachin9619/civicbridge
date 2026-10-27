"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  Building2, LayoutDashboard, FileText, PlusCircle, Users, Settings,
  LogOut, Menu, X, Bell, ClipboardList, MapPin, ChevronDown,
  BarChart3, Shield, Briefcase, Calendar, ShieldCheck, Phone, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const citizenLinks = [
  { href: "/dashboard", label: "Dashboard", hindi: "डैशबोर्ड", icon: LayoutDashboard },
  { href: "/dashboard/report", label: "Lodge Grievance", hindi: "शिकायत दर्ज करें", icon: PlusCircle },
  { href: "/dashboard/complaints", label: "My Grievances", hindi: "मेरी शिकायतें", icon: FileText },
  { href: "/wards", label: "Ward Scorecard", hindi: "स्वच्छता रैंकिंग", icon: Trophy },
  { href: "/dashboard/profile", label: "Citizen Profile", hindi: "नागरिक प्रोफ़ाइल", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Overview", hindi: "कमान केंद्र", icon: LayoutDashboard },
  { href: "/admin/complaints", label: "All Grievances", hindi: "सभी शिकायतें", icon: FileText },
  { href: "/admin/assignments", label: "Work Allocation", hindi: "कार्य आवंटन", icon: ClipboardList },
  { href: "/admin/map", label: "Grievance Map", hindi: "मानचित्र", icon: MapPin },
  { href: "/wards", label: "Ward Scorecard", hindi: "स्वच्छता रैंकिंग", icon: Trophy },
  { href: "/admin/departments", label: "Departments", hindi: "विभाग", icon: Building2 },
  { href: "/admin/employees", label: "Staff Roster", hindi: "कर्मचारी", icon: Users },
  { href: "/admin/analytics", label: "Analytics", hindi: "विश्लेषण", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit Trail", hindi: "ऑडिट लॉग", icon: Shield },
];

const employeeLinks = [
  { href: "/employee", label: "Assigned Tasks", hindi: "आवंटित कार्य", icon: Briefcase },
  { href: "/employee/completed", label: "Completed Proofs", hindi: "पूर्ण कार्य", icon: ClipboardList },
  { href: "/employee/profile", label: "Officer Profile", hindi: "प्रोफ़ाइल", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, signOut } = useAuth();
  const { language, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Connecting to Municipal Government Gateway..." />
      </div>
    );
  }

  const links =
    profile?.role === "admin" ? adminLinks :
    profile?.role === "employee" ? employeeLinks :
    citizenLinks;

  const portalLabel =
    profile?.role === "admin" ? "Municipal Admin Cockpit" :
    profile?.role === "employee" ? "Field Operations Portal" :
    "Citizen Grievance Redressal";

  const portalHindi =
    profile?.role === "admin" ? "नगर निगम कमान केंद्र" :
    profile?.role === "employee" ? "क्षेत्रीय कर्मचारी पोर्टल" :
    "राष्ट्रीय नागरिक सेवा पोर्टल";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      {/* 1. TOP TRI-COLOR ACCENT STRIPE */}
      <div className="h-1.5 w-full flex shrink-0">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      {/* 2. GOVERNMENT UTILITY / META BAR */}
      <div className="bg-[#1f2937] text-slate-200 text-xs py-1 px-4 border-b border-slate-700 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide">
            <span className="text-amber-400 font-bold">भारत सरकार</span>
            <span className="text-slate-400">|</span>
            <span>Government of India</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-slate-300">Ministry of Housing & Urban Affairs (MoHUA)</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="hidden md:flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="h-3 w-3" /> Secure Govt Portal
            </span>
            <span className="text-slate-600">|</span>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </div>

      {/* Main Wrapper with Sidebar and Content */}
      <div className="flex-1 flex min-h-0">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-68 flex flex-col bg-white border-r border-slate-200 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto shadow-xs",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Sidebar Header with Emblem */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                {/* Ashoka Stambh SVG */}
                <div className="h-10 w-8 flex flex-col items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 120" className="h-full w-full text-amber-800" fill="currentColor">
                    <path d="M50 5 C40 5 35 15 35 25 C35 30 38 35 42 38 C35 40 30 46 30 55 C30 65 38 72 45 74 L45 88 L30 92 L30 98 L70 98 L70 92 L55 88 L55 74 C62 72 70 65 70 55 C70 46 65 40 58 38 C62 35 65 30 65 25 C65 15 60 5 50 5 Z M50 12 C55 12 58 17 58 24 C58 30 54 34 50 34 C46 34 42 30 42 24 C42 17 45 12 50 12 Z M50 78 C54 78 57 81 57 85 C57 89 54 92 50 92 C46 92 43 89 43 85 C43 81 46 78 50 78 Z" />
                    <rect x="20" y="102" width="60" height="4" rx="1" fill="#8B4513" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-[#002d62]">CivicBridge</span>
                    <span className="text-[9px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-1 rounded">
                      .gov.in
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-amber-900 leading-tight">
                    {portalHindi}
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium">
                    {portalLabel}
                  </p>
                </div>
              </Link>
              <button className="lg:hidden p-1 rounded-md hover:bg-slate-200" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* User Role Card inside Sidebar */}
          <div className="p-3 bg-blue-50/70 border-b border-blue-100 flex items-center gap-2.5">
            <Avatar name={profile?.full_name || "User"} size="sm" className="h-8 w-8 text-xs font-bold" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {profile?.full_name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                  profile?.role === "admin"
                    ? "bg-purple-100 text-purple-900 border border-purple-200"
                    : profile?.role === "employee"
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    : "bg-blue-100 text-blue-900 border border-blue-200"
                }`}>
                  {profile?.role === "admin" ? "प्रशासक / Admin" : profile?.role === "employee" ? "अधिकारी / Officer" : "नागरिक / Citizen"}
                </span>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" &&
                  link.href !== "/admin" &&
                  link.href !== "/employee" &&
                  pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#002d62] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon className={cn("h-4 w-4", isActive ? "text-amber-400" : "text-slate-500")} />
                    <span>
                      {language === "hi" ? link.hindi : link.label}
                    </span>
                  </div>
                  {language === "mix" && (
                    <span className={cn("text-[10px] font-medium opacity-80", isActive ? "text-amber-300" : "text-slate-400")}>
                      {link.hindi}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* National Helpline Info in Sidebar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Phone className="h-3 w-3 text-red-700" />
              <span>National Civic Helpline</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Toll-Free: <span className="font-mono font-bold text-slate-700">1800-11-2026</span>
            </p>
          </div>

          {/* Sign Out Button */}
          <div className="border-t border-slate-200 p-2">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              लॉग आउट / Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100 text-slate-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  {language === "hi"
                    ? (links.find((l) => l.href === pathname)?.hindi || "डैशबोर्ड")
                    : (links.find((l) => l.href === pathname)?.label || "Dashboard")}
                </h1>
                {language === "mix" && (
                  <p className="text-[10px] text-slate-500 font-medium">
                    {links.find((l) => l.href === pathname)?.hindi || "नागरिक सेवा केंद्र"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher in Header */}
              <LanguageSwitcher variant="compact" />

              {/* Report Issue Quick Action (For Citizens) */}
              {profile?.role === "citizen" && (
                <Link href="/dashboard/report">
                  <Button size="sm" variant="primary" className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white text-xs font-bold gap-1 shadow-xs h-8">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {language === "hi" ? "शिकायत दर्ज करें" : language === "en" ? "Lodge Grievance" : "शिकायत दर्ज करें | Lodge"}
                    </span>
                  </Button>
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition-colors"
                >
                  <Avatar name={profile?.full_name || "User"} size="sm" className="h-8 w-8 text-xs font-bold" />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{profile?.full_name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{profile?.role}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-1 divide-y divide-slate-100 text-xs">
                      <div className="px-3 py-2 bg-slate-50">
                        <p className="font-bold text-slate-900">{profile?.full_name}</p>
                        <p className="text-[11px] text-slate-500">{profile?.email}</p>
                        <span className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded">
                          Role: {profile?.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          href={profile?.role === "admin" ? "/admin" : profile?.role === "employee" ? "/employee/profile" : "/dashboard/profile"}
                          className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-3.5 w-3.5 text-slate-500" /> My Profile
                        </Link>
                        <Link
                          href="/"
                          className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Building2 className="h-3.5 w-3.5 text-slate-500" /> National Portal Home
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-3 py-2 text-red-700 hover:bg-red-50 font-bold"
                        >
                          <LogOut className="h-3.5 w-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>

          {/* Official Indian Gov Footer in Dashboard */}
          <footer className="border-t border-slate-200 bg-white py-3 px-4 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1">
            <span>
              National Civic Grievance & Urban Governance Platform • Ministry of Housing & Urban Affairs (MoHUA)
            </span>
            <span>
              Site Hosted by National Informatics Centre (NIC) • All Rights Reserved © {new Date().getFullYear()}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
