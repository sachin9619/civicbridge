"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";
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
          पासवर्ड रीसेट अनुरोध
        </CardTitle>
        <p className="text-xs font-semibold text-slate-600">Password Recovery Gateway</p>
        <CardDescription className="text-xs text-slate-500 mt-1">
          {isSubmitted
            ? "An official password reset link has been dispatched to your registered address."
            : "Enter your registered email address to receive secure password recovery instructions."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {isSubmitted ? (
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-800" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Please check your inbox and click the authentication link. For security, this link expires in 24 hours.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full text-xs font-bold gap-1.5 border-slate-300">
                  <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Registered Email Address *"
                type="email"
                placeholder="citizen@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-[#002d62] hover:bg-[#001d42] text-white font-bold text-xs py-2.5 shadow-sm"
                isLoading={isLoading}
              >
                Send Secure Reset Link
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-xs text-blue-800 hover:text-blue-900 font-bold hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
