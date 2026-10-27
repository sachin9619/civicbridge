"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";
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
      <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl bg-white">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <div className="animate-spin mx-auto h-8 w-8 rounded-full border-2 border-slate-200 border-t-[#002d62]" />
          <p className="text-xs font-semibold text-slate-700">Verifying secure authentication link...</p>
        </CardContent>
      </Card>
    );
  }

  if (isValidSession === false) {
    return (
      <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl bg-white">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-700" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Expired or Invalid Link</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            This password recovery link has either expired or has already been used. Please request a new recovery link.
          </p>
          <div className="pt-2">
            <Link href="/forgot-password">
              <Button variant="primary" className="w-full bg-[#002d62] text-xs font-bold">
                Request New Recovery Link
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl bg-white">
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      <CardHeader className="text-center pb-3 pt-6">
        <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-100">
          <KeyRound className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl font-black text-slate-900">
          नया पासवर्ड बनाएं
        </CardTitle>
        <p className="text-xs font-semibold text-slate-600">Create New Portal Password</p>
        <CardDescription className="text-xs text-slate-500 mt-1">
          Set a secure password for your CivicBridge government account.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="New Password *"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              hint="Must contain uppercase, lowercase, and a number"
              error={errors.password?.message}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            label="Confirm New Password *"
            type="password"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            error={errors.confirm_password?.message}
            {...register("confirm_password")}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#002d62] hover:bg-[#001d42] text-white font-bold text-xs py-2.5 shadow-sm"
            isLoading={isLoading}
          >
            Update Account Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
