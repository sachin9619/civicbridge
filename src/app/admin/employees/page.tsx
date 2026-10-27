"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/types";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*, department:departments(name)")
        .in("role", ["employee", "admin"])
        .order("full_name");
      setEmployees(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Staff Directory</h1>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : employees.length === 0 ? (
        <EmptyState icon={Users} title="No staff members" description="Employee accounts need to be provisioned through the Supabase dashboard." />
      ) : (
        <div className="space-y-2">
          {employees.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar name={emp.full_name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{emp.full_name}</p>
                  <p className="text-xs text-slate-500">{emp.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(emp as any).department?.name && <Badge variant="default" className="text-[10px]">{(emp as any).department.name}</Badge>}
                  <Badge variant={emp.role === "admin" ? "purple" : "primary"} className="text-[10px] capitalize">{emp.role}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
