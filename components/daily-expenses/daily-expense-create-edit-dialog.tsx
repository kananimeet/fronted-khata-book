"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  DailyExpense,
  DailyExpenseType,
  CATEGORY_OPTIONS,
} from "@/types/daily-expense";
import {
  createDailyExpense,
  updateDailyExpense,
  getDailyExpensePhotoUrl,
} from "@/lib/daily-expense-api";
import { getApiErrorMessage } from "@/lib/api";
import {
  Home,
  User as UserIcon,
  IndianRupee,
  Calendar,
  UploadCloud,
  FileImage,
  X,
  Loader2,
  Info,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const expenseSchema = z.object({
  expense_type: z.enum(["room", "own"]),
  amount: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount cannot exceed ₹10,00,000"),
  category: z.string().min(1, "Please select a category"),
  expense_date: z.string().min(1, "Please select a date"),
  note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface DailyExpenseCreateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseToEdit?: DailyExpense | null;
  onSuccess: (savedExpense: DailyExpense) => void;
}

export function DailyExpenseCreateEditDialog({
  open,
  onOpenChange,
  expenseToEdit,
  onSuccess,
}: DailyExpenseCreateEditDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(expenseToEdit);

  // File & Preview states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_type: "room",
      amount: undefined,
      category: "GROCERY",
      expense_date: todayStr,
      note: "",
    },
  });

  const selectedType = watch("expense_type");
  const selectedCategory = watch("category");

  // When dialog opens or expenseToEdit changes, initialize form
  useEffect(() => {
    if (open) {
      if (expenseToEdit) {
        setValue("expense_type", expenseToEdit.expense_type || "room");
        setValue("amount", expenseToEdit.amount);
        setValue("category", expenseToEdit.category || "GROCERY");

        // Format date string to YYYY-MM-DD
        const formattedDate = expenseToEdit.expense_date
          ? expenseToEdit.expense_date.split("T")[0]
          : todayStr;
        setValue("expense_date", formattedDate);

        setValue("note", expenseToEdit.note || "");

        if (expenseToEdit.payment_photo) {
          setExistingPhoto(getDailyExpensePhotoUrl(expenseToEdit.payment_photo) || null);
        } else {
          setExistingPhoto(null);
        }
      } else {
        reset({
          expense_type: "room",
          amount: undefined,
          category: "GROCERY",
          expense_date: todayStr,
          note: "",
        });
        setExistingPhoto(null);
      }
      setSelectedFile(null);
      setFilePreview(null);
    }
  }, [open, expenseToEdit, setValue, reset, todayStr]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validate image file
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Receipt file size cannot exceed 5MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingPhoto = () => {
    setExistingPhoto(null);
  };

  // Form submit handler
  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && expenseToEdit) {
        const updated = await updateDailyExpense(expenseToEdit.id, {
          amount: data.amount,
          category: data.category,
          expense_type: data.expense_type,
          expense_date: data.expense_date,
          note: data.note,
          payment_photo: selectedFile,
        });

        toast.success("Expense updated successfully!");
        onSuccess(updated);
        onOpenChange(false);
      } else {
        const created = await createDailyExpense({
          amount: data.amount,
          category: data.category,
          expense_type: data.expense_type,
          expense_date: data.expense_date,
          note: data.note,
          payment_photo: selectedFile,
        });

        toast.success(
          data.expense_type === "room"
            ? "Room expense recorded! Sent for admin approval to reduce rent liability."
            : "Personal expense recorded successfully!"
        );
        onSuccess(created);
        onOpenChange(false);
      }
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(
          err,
          isEditing
            ? "Failed to update daily expense. Please try again."
            : "Failed to record daily expense. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch category defaults when switching type
  const handleTypeSelect = (type: DailyExpenseType) => {
    setValue("expense_type", type);
    // If current category is not suitable for new type, switch to default
    if (type === "room") {
      const isRoomCat = CATEGORY_OPTIONS.some(
        (c) => c.id === selectedCategory && (c.type === "room" || c.type === "both")
      );
      if (!isRoomCat) setValue("category", "GROCERY");
    } else {
      const isOwnCat = CATEGORY_OPTIONS.some(
        (c) => c.id === selectedCategory && (c.type === "own" || c.type === "both")
      );
      if (!isOwnCat) setValue("category", "PERSONAL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isEditing ? "Edit Daily Expense" : "Record New Daily Expense"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEditing
                  ? "Update amount, category, receipt, or notes before approval."
                  : "Submit room groceries or personal expenses with receipt verification."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form
          id="daily-expense-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-5 space-y-5"
        >
          {/* 1. Visual Segmented Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expense Category / Type <span className="text-destructive">*</span>
            </Label>

            <div className="grid grid-cols-2 gap-3">
              {/* Room Expense Button */}
              <button
                type="button"
                onClick={() => handleTypeSelect("room")}
                className={cn(
                  "flex flex-col items-start gap-1 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative",
                  selectedType === "room"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-200 shadow-xs"
                    : "border-border/80 bg-card hover:border-border hover:bg-muted/30 text-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg",
                        selectedType === "room"
                          ? "bg-indigo-600 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Home className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm">Room Expense</span>
                  </div>
                  {selectedType === "room" && (
                    <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  Shared: Groceries, vegetables, gas, etc.
                </p>
              </button>

              {/* Personal Expense Button */}
              <button
                type="button"
                onClick={() => handleTypeSelect("own")}
                className={cn(
                  "flex flex-col items-start gap-1 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative",
                  selectedType === "own"
                    ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 text-purple-950 dark:text-purple-200 shadow-xs"
                    : "border-border/80 bg-card hover:border-border hover:bg-muted/30 text-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg",
                        selectedType === "own"
                          ? "bg-purple-600 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm">Personal (Own)</span>
                  </div>
                  {selectedType === "own" && (
                    <div className="h-5 w-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  Individual: Medicine, commute, snacks, etc.
                </p>
              </button>
            </div>

            {/* Dynamic Informational Alert Banner */}
            <div
              className={cn(
                "p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-colors",
                selectedType === "room"
                  ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                  : "bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200"
              )}
            >
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">
                  {selectedType === "room"
                    ? "Rent Reduction Rule: "
                    : "Personal Record Rule: "}
                </span>
                <span>
                  {selectedType === "room"
                    ? "This amount reduces your monthly room rent liability upon admin approval."
                    : "Sent to Admin for personal settlement/approval."}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Amount & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label
                htmlFor="amount"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-base font-bold text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  {...register("amount")}
                  className={cn(
                    "pl-8 text-lg font-bold tracking-tight h-11 bg-background",
                    errors.amount && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label
                htmlFor="expense_date"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Expense Date <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="expense_date"
                  type="date"
                  {...register("expense_date")}
                  className={cn(
                    "pl-10 h-11 bg-background",
                    errors.expense_date && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              {errors.expense_date && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.expense_date.message}
                </p>
              )}
            </div>
          </div>

          {/* 3. Category Dropdown */}
          <div className="space-y-1.5">
            <Label
              htmlFor="category"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Category <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              {...register("category")}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.description})
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.category.message}
              </p>
            )}
          </div>

          {/* 4. Notes / Items List */}
          <div className="space-y-1.5">
            <Label
              htmlFor="note"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Notes / Description (Optional)
            </Label>
            <textarea
              id="note"
              rows={3}
              placeholder="e.g. Tomatoes, potatoes, sunflower oil and bread from local market"
              {...register("note")}
              className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none transition-all"
            />
            {errors.note && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.note.message}
              </p>
            )}
          </div>

          {/* 5. Payment Photo / Receipt Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Receipt / Bill Photo (Optional)</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Max 5MB (PNG, JPG, WEBP)
              </span>
            </Label>

            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Existing Photo or Selected File Preview */}
            {filePreview || existingPhoto ? (
              <div className="relative rounded-xl border border-border overflow-hidden bg-muted/30 p-3 flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg overflow-hidden border border-border shrink-0 bg-background relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filePreview || existingPhoto || ""}
                    alt="Receipt preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <FileImage className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">
                      {selectedFile ? selectedFile.name : "Attached Receipt Bill"}
                    </span>
                  </div>
                  {selectedFile && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                  {existingPhoto && !selectedFile && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                      Existing bill uploaded
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <span className="text-muted-foreground text-xs">•</span>
                    <button
                      type="button"
                      onClick={selectedFile ? removeSelectedFile : removeExistingPhoto}
                      className="text-xs text-destructive hover:underline font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={selectedFile ? removeSelectedFile : removeExistingPhoto}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              /* Drag & Drop Upload Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all duration-200 group",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-border/80 hover:border-primary/60 hover:bg-muted/20"
                )}
              >
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Click to upload receipt, or drag & drop here
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Clear photos help admin verify room grocery reductions quickly
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="daily-expense-form"
            disabled={isSubmitting}
            className="text-xs font-semibold h-9 min-w-[120px] shadow-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isEditing ? "Saving..." : "Recording..."}
              </span>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Record Expense"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
