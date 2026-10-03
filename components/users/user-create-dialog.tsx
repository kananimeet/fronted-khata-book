"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Upload,
  X,
  Loader2,
  UserPlus,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Info,
} from "lucide-react";

import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const createUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  mobile: z
    .string()
    .min(10, { message: "Mobile number must be at least 10 digits" })
    .regex(/^\+?[0-9\s-]{10,15}$/, { message: "Invalid mobile number format (e.g. +919876543210)" }),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters if provided",
    }),
  is_active: z.boolean(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export function UserCreateDialog({
  open,
  onOpenChange,
  onUserCreated,
}: UserCreateDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setApiError("Please select a valid image file (PNG, JPG, WebP)");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetAll = () => {
    reset();
    handleRemoveImage();
    setApiError(null);
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setApiError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("email", data.email.trim().toLowerCase());
      formData.append("mobile", data.mobile.trim());
      formData.append("role", "USER");
      formData.append("is_active", data.is_active ? "true" : "false");

      if (data.password && data.password.trim().length > 0) {
        formData.append("password", data.password.trim());
      }

      if (selectedFile) {
        formData.append("profile_picture", selectedFile);
      }

      // Important: Do not set Content-Type header manually
      await api.post("/users", formData);

      toast.success(`User "${data.name}" was created successfully.`);
      resetAll();
      onOpenChange(false);
      onUserCreated();
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, "Failed to create user. Please check the details."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetAll();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <UserPlus className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">Add New User</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Register a new client or team member to access the KhataBook portal.
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <Alert variant="destructive" className="py-2.5">
            <AlertDescription className="text-xs font-medium">
              {apiError}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1" noValidate>
          {/* Profile Picture Upload & Circular Preview */}
          <div className="flex flex-col items-center justify-center gap-3 p-3 rounded-xl bg-muted/30 border border-dashed border-border">
            <div className="relative group">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20 shadow-md">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} alt="Preview" className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <UserIcon className="h-9 w-9" />
                  </AvatarFallback>
                )}
              </Avatar>

              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="user-profile-input"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="text-xs h-8 gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                {imagePreview ? "Change Photo" : "Upload Profile Photo"}
              </Button>
              <p className="text-[11px] text-muted-foreground mt-1">
                Optional: JPG, PNG or WebP up to 5MB
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="create-name" className="text-xs font-semibold">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="create-name"
                placeholder="e.g. Ramesh Patel"
                disabled={isSubmitting}
                className={`pl-9.5 ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="create-email" className="text-xs font-semibold">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="create-email"
                type="email"
                placeholder="ramesh@example.com"
                disabled={isSubmitting}
                className={`pl-9.5 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <Label htmlFor="create-mobile" className="text-xs font-semibold">
              Mobile Number <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="create-mobile"
                placeholder="+919876543210"
                disabled={isSubmitting}
                className={`pl-9.5 ${errors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...register("mobile")}
              />
            </div>
            {errors.mobile && (
              <p className="text-xs text-destructive font-medium">{errors.mobile.message}</p>
            )}
          </div>

          {/* Password (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-password" className="text-xs font-semibold">
                Initial Password <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="create-password"
                type="password"
                placeholder="Leave blank for first-time login setup"
                disabled={isSubmitting}
                className={`pl-9.5 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
            <div className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>
                Admin can leave password empty; the user will be prompted to set their password on first login.
              </span>
            </div>
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
            <div className="space-y-0.5">
              <Label htmlFor="create-active" className="text-sm font-semibold cursor-pointer">
                Account Active Status
              </Label>
              <p className="text-xs text-muted-foreground">
                {isActive ? "User will be able to log in immediately" : "User login will be disabled"}
              </p>
            </div>
            <Switch
              id="create-active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-semibold gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
