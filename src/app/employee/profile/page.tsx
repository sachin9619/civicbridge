"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileUpdateSchema, type ProfileUpdateFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Mail, Calendar, Shield, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

export default function EmployeeProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { full_name: profile?.full_name || "" },
  });

  const onSubmit = async (data: ProfileUpdateFormData) => {
    if (!profile) return;
    setIsLoading(true); setError(null); setSuccess(false);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("profiles").update({ full_name: data.full_name }).eq("id", profile.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setSuccess(true);
    } catch { setError("Failed to update profile."); }
    finally { setIsLoading(false); }
  };

  if (!profile) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Profile</h1>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={profile.full_name} size="lg" />
            <div>
              <p className="text-base font-semibold text-slate-900">{profile.full_name}</p>
              <p className="text-sm text-slate-500 capitalize">{profile.role}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" /> {profile.email}</div>
            <div className="flex items-center gap-2 text-slate-600"><Calendar className="h-4 w-4 text-slate-400" /> Joined {formatDate(profile.created_at)}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Update Profile</CardTitle></CardHeader>
        <CardContent>
          {success && <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">Profile updated!</div>}
          {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full name" error={errors.full_name?.message} {...register("full_name")} />
            <Button type="submit" variant="primary" isLoading={isLoading}>Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
