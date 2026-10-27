"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Mail } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle className="text-xl">{isSubmitted ? "Check your email" : "Forgot password"}</CardTitle>
          <CardDescription>{isSubmitted ? "If an account exists with that email, we've sent a password reset link." : "Enter your email and we'll send you a reset link"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center"><Mail className="h-6 w-6 text-blue-600" /></div>
              <p className="text-sm text-slate-500 mb-6">Check your inbox and follow the instructions. The link expires in 24 hours.</p>
              <Link href="/login"><Button variant="outline" className="w-full"><ArrowLeft className="h-4 w-4" /> Back to sign in</Button></Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Email address" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register("email")} />
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>Send reset link</Button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back to sign in</Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
