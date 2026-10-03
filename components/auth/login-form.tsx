"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { api, getApiErrorMessage, getProfilePictureUrl } from "@/lib/api";
import { CheckEmailResponse, LoginResponse, User } from "@/types/auth";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Validation schemas
const emailStepSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
});

const passwordSetupSchema = z
  .object({
    new_password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirm_password: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const normalLoginSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

type EmailStepData = z.infer<typeof emailStepSchema>;
type PasswordSetupData = z.infer<typeof passwordSetupSchema>;
type NormalLoginData = z.infer<typeof normalLoginSchema>;

type UserStep = "STEP_1_EMAIL" | "STEP_2A_SETUP" | "STEP_2B_LOGIN";

export function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<UserStep>("STEP_1_EMAIL");
  const [checkedUser, setCheckedUser] = useState<User | null>(null);
  const [checkedEmail, setCheckedEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [setupSuccessMessage, setSetupSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forms
  const emailForm = useForm<EmailStepData>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: "" },
  });

  const setupForm = useForm<PasswordSetupData>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const normalLoginForm = useForm<NormalLoginData>({
    resolver: zodResolver(normalLoginSchema),
    defaultValues: { password: "" },
  });

  // Extract initials for fallback avatar
  const getInitials = (name?: string) => {
    if (!name) return "KB";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Password strength calculator
  const newPasswordValue = setupForm.watch("new_password") || "";
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-muted" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-destructive" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500" };
      case 3:
        return { score: 3, label: "Good", color: "bg-blue-500" };
      case 4:
      default:
        return { score: 4, label: "Strong", color: "bg-emerald-500" };
    }
  };
  const passwordStrength = getPasswordStrength(newPasswordValue);

  // Step 1: Check Email
  const onEmailSubmit = async (data: EmailStepData) => {
    setApiError(null);
    setSetupSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await api.post<CheckEmailResponse>(
        "/auth/check-email",
        { email: data.email.trim().toLowerCase() }
      );

      const resData = response.data?.data;
      if (!resData || resData.exists === false) {
        setApiError("No account found with this email. Please check your spelling or contact your administrator.");
        return;
      }

      setCheckedEmail(data.email.trim().toLowerCase());
      setCheckedUser(resData.user);

      // Check BOTH has_login and is_password_set:
      // When has_login === true or is_password_set === true -> DIRECTLY show user login with Email & Password!
      const hasPasswordAlready = Boolean(
        resData.has_login === true ||
        resData.is_password_set === true ||
        (resData as unknown as { has_login?: boolean }).has_login ||
        (resData as unknown as { is_password_set?: boolean }).is_password_set
      );

      if (hasPasswordAlready) {
        // DIRECT LOGIN PAGE with email and password
        setStep("STEP_2B_LOGIN");
        normalLoginForm.reset({ password: "" });
      } else {
        // First-time setup when password is not yet configured
        setStep("STEP_2A_SETUP");
        setupForm.reset({ new_password: "", confirm_password: "" });
      }
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, "Unable to verify email. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2A: Set Password -> DO NOT auto-login! Go to direct login page!
  const onPasswordSetupSubmit = async (data: PasswordSetupData) => {
    setApiError(null);
    setIsLoading(true);
    try {
      await api.post<LoginResponse>(
        "/auth/set-password",
        {
          email: checkedEmail,
          new_password: data.new_password,
        }
      );

      // Show toast and take user to Step 2B (Direct Login Page with Email & Password)
      toast.success("Password created successfully! Please enter your password to sign in.");
      setSetupSuccessMessage("Your password has been saved. Please sign in below.");
      setStep("STEP_2B_LOGIN");
      normalLoginForm.reset({ password: "" });
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, "Failed to set password. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2B: Normal Login -> Calls /auth/user/login and redirects to Dashboard
  const onNormalLoginSubmit = async (data: NormalLoginData) => {
    setApiError(null);
    setIsLoading(true);
    try {
      const response = await api.post<LoginResponse>(
        "/auth/user/login",
        {
          email: checkedEmail,
          password: data.password,
        }
      );

      const token = response.data?.access_token || response.data?.data?.access_token;
      const user = response.data?.user || response.data?.data?.user;

      if (token && user) {
        toast.success(`Welcome back, ${user.name || "User"}!`);
        login(token, user);
      } else {
        setApiError("Authentication succeeded but token was missing.");
      }
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, "Invalid password. Please check and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  // Back to Email Step
  const handleBackToEmail = () => {
    setApiError(null);
    setSetupSuccessMessage(null);
    setStep("STEP_1_EMAIL");
    emailForm.setValue("email", checkedEmail);
  };

  const profileUrl = getProfilePictureUrl(checkedUser?.profile_picture);

  return (
    <div className="w-full space-y-4">
      {/* Main Glassmorphic Card */}
      <Card className="w-full shadow-2xl border-border/80 bg-card/95 backdrop-blur-xl relative overflow-hidden transition-all duration-300">
        {/* Top radiant animated bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-primary to-indigo-500" />

        {/* Card Header with Cute Mascot & Animated Emoji */}
        <CardHeader className="space-y-3 text-center pb-3 pt-7">
          {/* Animated Mascot / Icon Badge */}
          <div className="relative mx-auto flex items-center justify-center">
            {step === "STEP_2A_SETUP" ? (
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-lg ring-4 ring-emerald-500/20 animate-gentle-bounce">
                <KeyRound className="h-10 w-10" />
                <span className="absolute -top-1 -right-1 text-2xl select-none">✨</span>
                <span className="absolute -bottom-1 -left-1 text-2xl select-none">🎉</span>
              </div>
            ) : (
              <div className="relative group cursor-pointer animate-gentle-bounce">
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-xl ring-4 ring-primary/25 border-2 border-background bg-gradient-to-b from-primary/10 to-primary/5 transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/images/khatabook-mascot.jpg"
                    alt="KhataBook Mascot"
                    width={80}
                    height={80}
                    priority
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Playful Floating Animated Wave Emoji Badge */}
                <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-md select-none text-sm">
                  <span className="animate-wave">👋</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
              <span>
                {step === "STEP_2A_SETUP"
                  ? "Create Password"
                  : step === "STEP_2B_LOGIN"
                  ? `Welcome, ${checkedUser?.name?.split(" ")[0] || "User"}!`
                  : "KhataBook Login"}
              </span>
              {step !== "STEP_2A_SETUP" && (
                <span className="inline-block text-xl">✨</span>
              )}
            </CardTitle>

            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {step === "STEP_1_EMAIL"
                ? "Enter your registered email address to continue"
                : step === "STEP_2A_SETUP"
                ? "First-time setup: Create a password for your account"
                : "Enter your password to sign in to your dashboard"}
            </CardDescription>
          </div>
        </CardHeader>

        {/* User Identity Preview Chip for Step 2A / 2B */}
        {(step === "STEP_2A_SETUP" || step === "STEP_2B_LOGIN") && checkedUser && (
          <div className="px-6 pb-2 animate-step-transition">
            <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/80 p-2.5 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-9 w-9 border border-border shrink-0 shadow-xs ring-1 ring-primary/20">
                  {profileUrl && (
                    <AvatarImage src={profileUrl} alt={checkedUser?.name || "User"} />
                  )}
                  <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                    {getInitials(checkedUser?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {checkedUser?.name || "KhataBook User"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{checkedEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={isLoading}
                className="text-xs text-primary hover:text-primary/90 font-semibold px-2 py-1 rounded hover:bg-primary/10 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* Setup Success Banner (when arriving at Step 2B after set-password) */}
        {setupSuccessMessage && step === "STEP_2B_LOGIN" && (
          <div className="px-6 pt-2 animate-step-transition">
            <Alert className="py-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <AlertDescription className="text-xs font-semibold ml-2">
                {setupSuccessMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* API Error Alert */}
        {apiError && (
          <div className="px-6 pt-2 animate-step-transition">
            <Alert variant="destructive" className="py-2.5 border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs font-medium ml-2">
                {apiError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* ==================== STEP 1: ENTER EMAIL ==================== */}
        {step === "STEP_1_EMAIL" && (
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            noValidate
            className="animate-step-transition"
          >
            <CardContent className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label htmlFor="step1-email" className="text-xs font-semibold text-foreground">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="step1-email"
                    type="email"
                    placeholder="Enter your registered email"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    className={`pl-9.5 transition-all ${
                      emailForm.formState.errors.email
                        ? "border-destructive focus-visible:ring-destructive"
                        : "focus-visible:ring-primary/30"
                    }`}
                    {...emailForm.register("email")}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive font-medium">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
              <Button
                type="submit"
                className="w-full font-semibold shadow-md group h-10 transition-all hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking email...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}

        {/* ==================== STEP 2A: FIRST TIME PASSWORD SETUP ==================== */}
        {step === "STEP_2A_SETUP" && (
          <form
            onSubmit={setupForm.handleSubmit(onPasswordSetupSubmit)}
            noValidate
            className="animate-step-transition"
          >
            <CardContent className="space-y-3.5 pt-2">
              <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 shadow-xs">
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    Welcome, {checkedUser?.name || "Friend"}! 🥳
                  </span>{" "}
                  Please create a password for your account. You will then be able to log in.
                </div>
              </div>

              {/* Email Address field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={checkedEmail}
                    readOnly
                    tabIndex={-1}
                    className="pl-9.5 bg-muted/30 font-medium text-foreground cursor-default select-none"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="setup-new-password" className="text-xs font-semibold text-foreground">
                    New Password
                  </Label>
                  {newPasswordValue.length > 0 && (
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Strength:{" "}
                      <span className={passwordStrength.score >= 3 ? "text-emerald-500" : "text-amber-500"}>
                        {passwordStrength.label}
                      </span>
                    </span>
                  )}
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="setup-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    autoFocus
                    disabled={isLoading}
                    className={`pl-9.5 pr-10 ${
                      setupForm.formState.errors.new_password
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    {...setupForm.register("new_password")}
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

                {newPasswordValue.length > 0 && (
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[1, 2, 3, 4].map((stepIdx) => (
                      <div
                        key={stepIdx}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          stepIdx <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {setupForm.formState.errors.new_password && (
                  <p className="text-xs text-destructive font-medium">
                    {setupForm.formState.errors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="setup-confirm-password" className="text-xs font-semibold text-foreground">
                  Confirm Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="setup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-type your password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className={`pl-9.5 pr-10 ${
                      setupForm.formState.errors.confirm_password
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    {...setupForm.register("confirm_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {setupForm.formState.errors.confirm_password && (
                  <p className="text-xs text-destructive font-medium">
                    {setupForm.formState.errors.confirm_password.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
              <Button
                type="submit"
                className="w-full font-semibold shadow-md h-10 transition-all hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving password...
                  </>
                ) : (
                  "Save Password & Go to Login"
                )}
              </Button>

              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={isLoading}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Use a different email
              </button>
            </CardFooter>
          </form>
        )}

        {/* ==================== STEP 2B: USER LOGIN (EMAIL & PASSWORD TOGETHER) ==================== */}
        {step === "STEP_2B_LOGIN" && (
          <form
            onSubmit={normalLoginForm.handleSubmit(onNormalLoginSubmit)}
            noValidate
            className="animate-step-transition"
          >
            <CardContent className="space-y-4 pt-2">
              {/* Email Address Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-email-display" className="text-xs font-semibold text-foreground">
                    Email Address
                  </Label>
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    disabled={isLoading}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-email-display"
                    type="email"
                    value={checkedEmail}
                    readOnly
                    tabIndex={-1}
                    className="pl-9.5 bg-muted/25 font-medium text-foreground cursor-default"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="user-password" className="text-xs font-semibold text-foreground">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    autoFocus
                    disabled={isLoading}
                    className={`pl-9.5 pr-10 ${
                      normalLoginForm.formState.errors.password
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    {...normalLoginForm.register("password")}
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
                {normalLoginForm.formState.errors.password && (
                  <p className="text-xs text-destructive font-medium">
                    {normalLoginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
              <Button
                type="submit"
                className="w-full font-semibold shadow-md h-10 transition-all hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In to KhataBook"
                )}
              </Button>

              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={isLoading}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Sign in with another account
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
