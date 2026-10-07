"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { User } from "@/types/auth";
import { CreateExpensePayload } from "@/types/expense";
import { createExpense, getUsersForExpenseSelect } from "@/lib/expense-api";
import { getSetting } from "@/lib/setting-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ExpenseStatusBadge } from "./expense-status-badge";
import { UserSearchSelect } from "./user-search-select";
import { IndianRupee, Loader2, Info, AlertCircle, Lock } from "lucide-react";

interface ExpenseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseCreated: () => void;
  isAdmin?: boolean;
}

export function ExpenseCreateDialog({
  open,
  onOpenChange,
  onExpenseCreated,
  isAdmin: propIsAdmin,
}: ExpenseCreateDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Determine if the active session belongs to an Admin
  const isAdmin =
    propIsAdmin !== undefined
      ? propIsAdmin
      : currentUser?.role?.toUpperCase() === "ADMIN";

  // Form Fields
  const [defaultSettingAmount, setDefaultSettingAmount] = useState<number>(6000);
  const [isLoadingSetting, setIsLoadingSetting] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<string>("6000");
  const [payAmount, setPayAmount] = useState<string>("0");
  const [note, setNote] = useState<string>("room pay");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Admin User Selection State
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserObj, setSelectedUserObj] = useState<User | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSelectError, setUserSelectError] = useState<string | null>(null);

  const numTotal = Number(totalAmount) || 0;
  const numPay = Number(payAmount) || 0;
  const isOverPay = numPay > numTotal;
  const calculatedRemaining = Math.max(0, numTotal - numPay);

  // Auto-fetch default room rate from settings whenever dialog opens
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    async function loadSetting() {
      setIsLoadingSetting(true);
      try {
        const setting = await getSetting();
        if (isMounted && setting?.total_amount) {
          const defaultAmt = Number(setting.total_amount) || 6000;
          setDefaultSettingAmount(defaultAmt);
          setTotalAmount(String(defaultAmt));
          // Payable amount always defaults to 0 as required
          setPayAmount("0");
        }
      } catch (err) {
        console.warn("Could not load setting, using 6000 fallback:", err);
      } finally {
        if (isMounted) {
          setIsLoadingSetting(false);
        }
      }
    }

    loadSetting();

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Fetch users list when Admin opens the dialog
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await getUsersForExpenseSelect();
      setUsers(data);
    } catch (err: unknown) {
      setUsersError(getApiErrorMessage(err, "Failed to load users list."));
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (open && isAdmin) {
      fetchUsers();
    }
  }, [open, isAdmin, fetchUsers]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPayAmount("0");
    } else {
      setSelectedUserId("");
      setSelectedUserObj(null);
      setUserSelectError(null);
      setTotalAmount(String(defaultSettingAmount));
      setPayAmount("0");
      setNote("room pay");
    }
  }, [open, defaultSettingAmount]);

  const handleSelectUser = (id: string, user: User | null) => {
    setSelectedUserId(id);
    setSelectedUserObj(user);
    if (id) {
      setUserSelectError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation for Admin: User Selection is required
    if (isAdmin && !selectedUserId) {
      setUserSelectError("Please select a user for this expense.");
      toast.error("Please select a user before submitting.");
      return;
    }

    // 2. Amount validations
    if (!numTotal || numTotal <= 0) {
      toast.error("Fix room rent amount must be greater than 0.");
      return;
    }

    if (!payAmount.trim() || numPay <= 0) {
      toast.error(
        "Payment amount cannot be 0. Please enter an amount greater than 0."
      );
      return;
    }

    if (isOverPay) {
      toast.error(
        "Payable amount cannot be greater than the fix room rent."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateExpensePayload = {
        total: numTotal,
        total_amount: numTotal,
        pay: numPay,
        pay_amount: numPay,
        note: note.trim() || "room pay",
      };

      // Include user_id only when submitted by Admin
      if (isAdmin && selectedUserId) {
        payload.user_id = selectedUserId;
        payload.userId = selectedUserId;
      }

      await createExpense(payload);

      toast.success(
        isAdmin
          ? "Expense successfully recorded for user!"
          : "Room rent expense request submitted successfully!"
      );
      onOpenChange(false);
      onExpenseCreated();

      // Reset form
      setSelectedUserId("");
      setSelectedUserObj(null);
      setUserSelectError(null);
      setTotalAmount("6000");
      setPayAmount("5000");
      setNote("room pay");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to submit expense request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Room Rent Request
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Submit a room rate expense payment request for admin review.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 1. Admin Only: Select User Dropdown */}
            {isAdmin && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="admin_user_select"
                    className="text-xs font-semibold"
                  >
                    Select User <span className="text-destructive">*</span>
                  </Label>
                  {users.length > 0 && !isLoadingUsers && (
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {users.length} user{users.length === 1 ? "" : "s"} found
                    </span>
                  )}
                </div>

                <UserSearchSelect
                  id="admin_user_select"
                  users={users}
                  selectedUserId={selectedUserId}
                  onSelectUser={handleSelectUser}
                  isLoading={isLoadingUsers}
                  error={usersError}
                  onRetry={fetchUsers}
                  disabled={isSubmitting}
                  hasError={!!userSelectError}
                  placeholder="Select user (name, mobile, email)..."
                />

                {userSelectError && (
                  <p className="flex items-center gap-1 text-xs text-destructive mt-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {userSelectError}
                  </p>
                )}

                {/* Selected user preview pill */}
                {selectedUserObj && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                    <span className="text-muted-foreground font-medium">Assigned to:</span>
                    <span className="font-semibold text-primary truncate">
                      {selectedUserObj.name}
                    </span>
                    {(selectedUserObj.mobile || selectedUserObj.email) && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        ({selectedUserObj.mobile || selectedUserObj.email})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Fix Room Rent Field (Disabled / Locked UI) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="total_amount" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Fix Room Rent (₹)</span>
                  <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/60">
                    <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                    Fixed / Locked
                  </span>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground/80 pointer-events-none">
                  ₹
                </span>
                <Input
                  id="total_amount"
                  type="number"
                  required
                  readOnly
                  tabIndex={-1}
                  aria-disabled="true"
                  placeholder={String(defaultSettingAmount)}
                  value={totalAmount}
                  className="pl-7 pr-9 text-sm font-bold bg-muted/60 text-muted-foreground border-dashed border-border cursor-not-allowed select-none focus-visible:ring-0 focus-visible:border-border"
                />
                <div className="absolute right-3 top-2.5 text-muted-foreground/70 pointer-events-none" title="Fixed amount from system settings">
                  {isLoadingSetting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" />
                <span>Standard room rent amount configured in system settings.</span>
              </p>

              {numTotal <= 0 && (
                <p className="flex items-center gap-1 text-xs text-destructive mt-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Fix room rent amount is 0. Please configure a valid room rent in Settings.
                </p>
              )}
            </div>

            {/* Payable Amount Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pay_amount" className="text-xs font-semibold">
                  Payable Amount (₹) <span className="text-destructive">*</span>
                </Label>
                {numTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(numTotal))}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Pay Full (₹{numTotal})
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground pointer-events-none">
                  ₹
                </span>
                <Input
                  id="pay_amount"
                  type="number"
                  min="1"
                  max={numTotal || undefined}
                  step="any"
                  required
                  placeholder="e.g. 5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={`pl-7 text-sm font-semibold ${
                    isOverPay || (payAmount !== "" && numPay <= 0)
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
              </div>

              {payAmount !== "" && numPay <= 0 && (
                <p className="flex items-center gap-1 text-xs text-destructive mt-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Payment amount must be greater than 0 (cannot submit ₹0 amount).
                </p>
              )}

              {isOverPay && (
                <p className="flex items-center gap-1 text-xs text-destructive mt-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Payable amount cannot exceed fix room rent ({formatCurrency(numTotal)}).
                </p>
              )}
            </div>

            {/* Purpose / Note */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-semibold">
                Purpose / Note
              </Label>
              <Input
                id="note"
                type="text"
                placeholder="e.g. room pay, monthly rent"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Live Financial Breakdown Summary Card */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Financial Projection Preview</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/60">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">
                    Fix Room Rent
                  </div>
                  <div className="font-bold text-foreground text-sm">
                    {formatCurrency(numTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">
                    Payable Amount
                  </div>
                  <div className="font-bold text-primary text-sm">
                    {formatCurrency(numPay)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">
                    Remaining
                  </div>
                  <div
                    className={`font-bold text-sm ${
                      calculatedRemaining > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCurrency(calculatedRemaining)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px]">
                <span className="text-muted-foreground">Initial Submission Status:</span>
                <ExpenseStatusBadge status="PENDING" showIcon={false} />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isOverPay ||
                numTotal <= 0 ||
                numPay <= 0 ||
                !payAmount.trim()
              }
              className="gap-2 font-semibold shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAdmin ? "Creating..." : "Submitting..."}
                </>
              ) : isAdmin ? (
                "Create Expense"
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
