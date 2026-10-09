"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSetting, updateSetting } from "@/lib/setting-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AppSetting } from "@/types/setting";
import {
  Settings as SettingsIcon,
  IndianRupee,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Building,
  Info,
  Sparkles,
} from "lucide-react";

const QUICK_PRESETS = [5000, 6000, 7000, 8000, 10000, 12000];

export default function SettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const router = useRouter();

  // Redirect regular non-admin users away from settings
  useEffect(() => {
    if (!isAuthLoading && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, user, isAdmin, router]);

  const [setting, setSetting] = useState<AppSetting | null>(null);
  const [totalAmount, setTotalAmount] = useState<string>("6000");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Fetch current setting from GET /api/v1/settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getSetting();
      if (data) {
        setSetting(data);
        const amountStr = String(data.total_amount ?? 6000);
        setTotalAmount(amountStr);
        setHasChanges(false);
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to load system settings.");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Track if input differs from saved setting
  const handleAmountChange = (value: string) => {
    setTotalAmount(value);
    const num = Number(value);
    if (setting) {
      setHasChanges(num !== Number(setting.total_amount));
    }
  };

  // Quick preset click
  const handlePresetClick = (preset: number) => {
    handleAmountChange(String(preset));
  };

  // Save Settings via PATCH /api/v1/settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = Number(totalAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid room rent amount greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateSetting({
        total_amount: numAmount,
      });

      setSetting(updated);
      setTotalAmount(String(updated.total_amount));
      setHasChanges(false);
      toast.success("Default room rate updated successfully");
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to update settings.");
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const parsedAmount = Number(totalAmount) || 0;

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-7 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-72 bg-muted/60 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="h-64 rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading system settings...</span>
        </div>
      </div>
    );
  }

  // Non-admin block
  if (!isAdmin) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 text-center py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Admin Access Required</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          System settings are restricted to administrators only. Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 ring-2 ring-white/50 dark:ring-white/10 shrink-0">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              System Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Configure default room rent expense rates and portal administrative preferences.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          disabled={isLoading || isSaving}
          className="gap-2 text-xs self-start sm:self-auto cursor-pointer rounded-xl glass-pill h-10 px-4 hover:border-violet-500/40"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-violet-600" : "text-muted-foreground"}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSettings}
            className="ml-auto h-7 text-xs rounded-lg"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Settings Form Card */}
      <form onSubmit={handleSaveSettings}>
        <Card className="glass-card rounded-2xl shadow-xl border border-white/60 dark:border-white/10 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Room Rent / Default Expense Amount
                </CardTitle>
                <CardDescription className="text-xs">
                  Set the default room rent expense amount (₹) automatically pre-filled when creating new expense requests.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="setting_total_amount"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                >
                  <span>Default Room Rent (₹)</span>
                  <span className="text-destructive">*</span>
                </Label>
                {setting && (
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Current active rate: <strong className="text-foreground">{formatCurrency(setting.total_amount)}</strong>
                  </span>
                )}
              </div>

              <div className="relative max-w-md">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted-foreground pointer-events-none">
                  ₹
                </span>
                <Input
                  id="setting_total_amount"
                  type="number"
                  min="1"
                  step="any"
                  required
                  disabled={!isAdmin || isSaving}
                  value={totalAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="e.g. 6000"
                  className="pl-8 text-base font-bold h-11"
                />
              </div>

              {!isAdmin && (
                <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Only administrators can modify the default room rent setting.
                </p>
              )}
            </div>

            {/* Quick Presets (Admin Only) */}
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Quick Amount Presets
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  {QUICK_PRESETS.map((preset) => {
                    const isSelected = parsedAmount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        disabled={isSaving}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25"
                            : "glass-pill text-foreground hover:border-violet-500/40"
                        }`}
                      >
                        ₹{preset.toLocaleString("en-IN")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Financial Projection Preview */}
            <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>Behavior in Create Expense Dialog</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                When any member or administrator opens the <strong>&quot;Room Rent Request&quot;</strong> dialog, the total room rent field will automatically default to{" "}
                <span className="font-bold text-violet-600 dark:text-violet-400 font-mono">{formatCurrency(parsedAmount)}</span>. Users can submit with this default or adjust their initial payment accordingly.
              </p>

              {setting?.updated_at && (
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Last modified:</span>
                  <span className="font-medium text-foreground">{formatDate(setting.updated_at)}</span>
                </div>
              )}
            </div>
          </CardContent>

          {isAdmin && (
            <CardFooter className="border-t border-border/50 bg-muted/10 py-4 px-6 flex items-center justify-between gap-3">
              <div className="text-[11px] text-muted-foreground">
                {hasChanges ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ● You have unsaved changes ({formatCurrency(parsedAmount)})
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Settings are currently up to date
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {hasChanges && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => {
                      if (setting) {
                        setTotalAmount(String(setting.total_amount));
                        setHasChanges(false);
                      }
                    }}
                    className="h-10 text-xs rounded-xl"
                  >
                    Discard
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isSaving || !hasChanges || parsedAmount <= 0}
                  className="h-10 px-5 rounded-xl gap-2 text-xs font-bold shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Settings...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save Settings</span>
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* Security & Access Overview Card */}
      <Card className="glass-card rounded-2xl shadow-lg border border-white/60 dark:border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <CardTitle className="text-sm font-semibold">Access & Permissions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5 pt-0">
          <p>
            • <strong>All Members:</strong> Can view the system default room rent rate to pre-fill their requests.
          </p>
          <p>
            • <strong>Administrators:</strong> Have full permission to update the rate via <code className="bg-muted px-1 py-0.5 rounded text-[11px]">PATCH /api/v1/settings</code>.
          </p>
          <p>
            • Changes take effect immediately across all client sessions without requiring server restarts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
