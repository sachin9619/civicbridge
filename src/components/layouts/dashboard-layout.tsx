"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Building2, LayoutDashboard, FileText, PlusCircle, Users, Settings,
  LogOut, Menu, X, Bell, ClipboardList, MapPin, ChevronDown,
  BarChart3, Shield, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const citizenLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/report", label: "Report Issue", icon: PlusCircle },
  { href: "/dashboard/complaints", label: "My Complaints", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/complaints", label: "All Complaints", icon: FileText },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/map", label: "Complaint Map", icon: MapPin },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit Log", icon: Shield },
];

const employeeLinks = [
  { href: "/employee", label: "My Tasks", icon: Briefcase },
  { href: "/employee/completed", label: "Completed", icon: ClipboardList },
  { href: "/employee/profile", label: "Profile", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Loading your dashboard..." />
      </div>
    );
  }

  const links =
    profile?.role === "admin" ? adminLinks :
    profile?.role === "employee" ? employeeLinks :
    citizenLinks;

  const portalLabel =
    profile?.role === "admin" ? "Admin Portal" :
    profile?.role === "employee" ? "Employee Portal" :
    "Citizen Portal";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-slate-200 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-tight">CivicBridge</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{portalLabel}</span>
            </div>
          </Link>
          <button className="lg:hidden p-1 rounded-md hover:bg-slate-100" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/admin" && link.href !== "/employee" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <link.icon className={cn("h-4.5 w-4.5", isActive ? "text-blue-600" : "text-slate-400")} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5 text-slate-400" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-base font-semibold text-slate-900 hidden sm:block">
              {links.find((l) => l.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link href={profile?.role === "admin" ? "/admin" : profile?.role === "employee" ? "/employee" : "/dashboard"}>
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="h-5 w-5 text-slate-500" />
              </button>
            </Link>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
              >
                <Avatar name={profile?.full_name || "User"} size="sm" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-900 leading-tight">{profile?.full_name}</p>
                  <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{profile?.full_name}</p>
                      <p className="text-xs text-slate-500">{profile?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
