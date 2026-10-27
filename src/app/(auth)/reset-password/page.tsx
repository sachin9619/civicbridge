"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Building2, KeyRound, AlertTriangle } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsValidSession(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsValidSession(true);
      else setTimeout(() => setIsValidSession((prev) => (prev === null ? false : prev)), 2000);
    });
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: data.password });
      if (updateError) { setError(updateError.message); return; }
      router.push("/login?reset=true");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-slate-900">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center"><Building2 className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-bold tracking-tight">CivicBridge</span>
          </div>
        </div>
        <Card><CardContent className="pt-6 text-center py-8">
          <div className="animate-spin mx-auto mb-4 h-8 w-8 rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Verifying your reset link...</p>
        </CardContent></Card>
      </>
    );
  }

  if (isValidSession === false) {
    return (
      <>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-900 hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center"><Building2 className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-bold tracking-tight">CivicBridge</span>
          </Link>
        </div>
        <Card><CardContent className="pt-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-amber-600" /></div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Invalid or expired link</h2>
          <p className="text-sm text-slate-500 mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password"><Button variant="primary" className="w-full">Request new reset link</Button></Link>
        </CardContent></Card>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-900 hover:opacity-80 transition-opacity">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center"><Building2 className="h-5 w-5 text-white" /></div>
          <span className="text-xl font-bold tracking-tight">CivicBridge</span>
        </Link>
      </div>
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center"><KeyRound className="h-6 w-6 text-blue-600" /></div>
          <CardTitle className="text-xl">Set new password</CardTitle>
          <CardDescription>Choose a strong new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Input label="New password" type={showPassword ? "text" : "password"} placeholder="Enter new password" autoComplete="new-password" hint="At least 8 characters with uppercase, lowercase, and a number" error={errors.password?.message} {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input label="Confirm new password" type="password" placeholder="Confirm new password" autoComplete="new-password" error={errors.confirm_password?.message} {...register("confirm_password")} />
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>Reset password</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
