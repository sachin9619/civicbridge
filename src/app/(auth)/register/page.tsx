"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus, CheckCircle2, ShieldCheck, Lock } from "lucide-react";
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
      <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl bg-white">
        <div className="h-1 w-full flex">
          <div className="h-full w-1/3 bg-[#FF9933]" />
          <div className="h-full w-1/3 bg-white" />
          <div className="h-full w-1/3 bg-[#138808]" />
        </div>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">नागरिक खाता पंजीकृत</h2>
          <p className="text-xs font-semibold text-slate-600">Citizen Account Registration Successful</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            We have dispatched an official verification confirmation link to your registered email address.
            Please verify your email to begin lodging municipal grievances.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="primary" className="w-full bg-[#002d62] hover:bg-[#001d42] text-xs font-bold">
                Return to Sign In Portal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl bg-white">
      {/* Top subtle tricolor stripe */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      <CardHeader className="text-center pb-3 pt-6">
        <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-100">
          <UserPlus className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl font-black text-slate-900">
          नया नागरिक पंजीकरण
        </CardTitle>
        <p className="text-xs font-semibold text-slate-600">Citizen Registration Portal</p>
        <CardDescription className="text-xs text-slate-500 mt-1">
          Create an official citizen account to report and track municipal civic issues.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-800 font-medium" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Citizen Full Name *"
            type="text"
            placeholder="e.g. Ramesh Kumar"
            autoComplete="name"
            error={errors.full_name?.message}
            {...register("full_name")}
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="ramesh.kumar@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="relative">
            <Input
              label="Create Secure Password *"
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
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            label="Confirm Password *"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={errors.confirm_password?.message}
            {...register("confirm_password")}
          />

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="accept_terms"
              className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              {...register("accept_terms")}
            />
            <label htmlFor="accept_terms" className="text-xs text-slate-600 leading-relaxed">
              I agree to the <span className="text-blue-800 font-medium hover:underline cursor-pointer">Citizen Charter</span> and <span className="text-blue-800 font-medium hover:underline cursor-pointer">National Data Protection Policy</span>.
            </label>
          </div>
          {errors.accept_terms && <p className="text-[11px] text-red-600 -mt-2">{errors.accept_terms.message}</p>}

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#002d62] hover:bg-[#001d42] text-white font-bold text-xs py-2.5 shadow-sm gap-2"
            isLoading={isLoading}
          >
            <UserPlus className="h-3.5 w-3.5" /> Complete Registration
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
          Already registered?{" "}
          <Link href="/login" className="text-blue-800 hover:text-blue-900 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
