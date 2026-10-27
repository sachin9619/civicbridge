"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus, Building2, CheckCircle2 } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accept_terms: false as unknown as true },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) {
        setError(authError.message.includes("already registered") ? "An account with this email already exists." : authError.message);
        return;
      }
      setIsSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-900">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center"><Building2 className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-bold tracking-tight">CivicBridge</span>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h2>
            <p className="text-sm text-slate-500 mb-6">We&apos;ve sent a verification link to your email. Click the link to verify your account.</p>
            <Link href="/login"><Button variant="outline" className="w-full">Return to sign in</Button></Link>
          </CardContent>
        </Card>
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
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Join CivicBridge to report and track civic issues</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full name" type="text" placeholder="Your full name" autoComplete="name" error={errors.full_name?.message} {...register("full_name")} />
            <Input label="Email address" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <div className="relative">
              <Input label="Password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" autoComplete="new-password" hint="At least 8 characters with uppercase, lowercase, and a number" error={errors.password?.message} {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input label="Confirm password" type="password" placeholder="Confirm your password" autoComplete="new-password" error={errors.confirm_password?.message} {...register("confirm_password")} />
            <div className="flex items-start gap-2">
              <input type="checkbox" id="accept_terms" className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" {...register("accept_terms")} />
              <label htmlFor="accept_terms" className="text-sm text-slate-600">
                I agree to the <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
              </label>
            </div>
            {errors.accept_terms && <p className="text-xs text-red-600 -mt-2">{errors.accept_terms.message}</p>}
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}><UserPlus className="h-4 w-4" /> Create account</Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}<Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
