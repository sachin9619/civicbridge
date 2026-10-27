import DashboardLayout from "@/components/layouts/dashboard-layout";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
