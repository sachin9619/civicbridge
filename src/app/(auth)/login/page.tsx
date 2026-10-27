"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn, Lock, ShieldCheck, UserCheck, Building2 } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (authError) {
        if (authError.message.includes("Email not confirmed")) {
          setError("Please verify your email address. Check your inbox for a verification link.");
        } else if (authError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(authError.message);
        }
        return;
      }

      // Check user role and route to the correct portal
      const { data: { user } } = await supabase.auth.getUser();
      let targetPath = redirect;

      if (user && (!searchParams.get("redirect") || redirect === "/dashboard")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          targetPath = "/admin";
        } else if (profile?.role === "employee") {
          targetPath = "/employee";
        } else {
          targetPath = "/dashboard";
        }
      }

      router.push(targetPath);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {searchParams.get("verified") === "true" && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800">
          Email verified successfully! You can now sign in.
        </div>
      )}
      {searchParams.get("reset") === "true" && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800">
          Password reset successfully! Sign in with your new password.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-800 font-medium" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Registered Email Address *"
          type="email"
          placeholder="citizen.name@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="relative">
          <Input
            label="Account Password *"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
            Remember on this device
          </label>
          <Link href="/forgot-password" className="text-blue-800 hover:text-blue-900 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full bg-[#002d62] hover:bg-[#001d42] text-white font-bold text-xs py-2.5 shadow-sm gap-2"
          isLoading={isLoading}
        >
          <Lock className="h-3.5 w-3.5" /> Sign In to Portal
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
        New Citizen User?{" "}
        <Link href="/register" className="text-blue-800 hover:text-blue-900 font-bold hover:underline">
          Register New Account
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl bg-white">
      {/* Top subtle tricolor stripe on card */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      <CardHeader className="text-center pb-3 pt-6">
        <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-100">
          <Lock className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl font-black text-slate-900">
          नागरिक एवं अधिकारी लॉगिन
        </CardTitle>
        <p className="text-xs font-semibold text-slate-600">Citizen & Municipal Officer Sign In</p>
        <CardDescription className="text-xs text-slate-500 mt-1">
          Access civic grievance reporting, field task execution, or administrative command center.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Suspense fallback={<div className="py-4 text-center text-xs text-slate-500">Loading secure gateway...</div>}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
