"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Mail,
  Lock,
  ArrowLeft,
  KeySquare,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { LoginResponse } from "@/types/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Admin email is required" })
    .email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type AdminLoginData = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      const storedFcmToken =
        typeof window !== "undefined"
          ? localStorage.getItem("khatabook_fcm_token")
          : null;

      const response = await api.post<LoginResponse>(
        "/auth/admin/login",
        {
          email: data.email.trim().toLowerCase(),
          password: data.password,
          ...(storedFcmToken ? { fcm_token: storedFcmToken } : {}),
        }
      );

      const token = response.data?.access_token || response.data?.data?.access_token;
      const user = response.data?.user || response.data?.data?.user;

      if (token && user) {
        toast.success(`Administrator session started: ${user.name || "Admin"}`);
        login(token, user);
      } else {
        setApiError("Authentication succeeded but token was missing.");
      }
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, "Invalid admin credentials. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card className="w-full shadow-2xl border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl relative overflow-hidden transition-all duration-300 rounded-3xl">
        {/* Top vibrant admin accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600" />

        <CardHeader className="space-y-3 text-center pb-4 pt-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 hover:scale-105">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-2 border border-indigo-500/20">
              <KeySquare className="h-3 w-3" />
              Restricted Area
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              KhataBook Admin Portal
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Sign in with your administrative account to access room management and member ledgers
            </CardDescription>
          </div>
        </CardHeader>

        {apiError && (
          <div className="px-6 pb-2 animate-step-transition">
            <Alert variant="destructive" className="py-2.5 border-destructive/30 bg-destructive/10 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs font-medium ml-2">
                {apiError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4 pt-2">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-xs font-semibold text-foreground">
                Admin Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@khatabook.com"
                  autoComplete="email"
                  autoFocus
                  disabled={isLoading}
                  className={`pl-9.5 rounded-xl ${
                    errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
                Admin Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`pl-9.5 pr-10 rounded-xl ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
            <Button
              type="submit"
              className="w-full font-bold shadow-md h-11 text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white rounded-xl shadow-indigo-500/25 hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying administrator...
                </>
              ) : (
                "Sign In to Admin Portal"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Back to User Login link */}
      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-lg hover:bg-muted/50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Regular User Login</span>
        </Link>
      </div>
    </div>
  );
}
