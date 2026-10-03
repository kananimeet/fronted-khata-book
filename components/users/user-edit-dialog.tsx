"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Upload,
  X,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Edit,
} from "lucide-react";

import { api, getApiErrorMessage, getProfilePictureUrl } from "@/lib/api";
import { User } from "@/types/auth";
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

const editUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  mobile: z
    .string()
    .min(10, { message: "Mobile number must be at least 10 digits" })
    .regex(/^\+?[0-9\s-]{10,15}$/, { message: "Invalid mobile format (e.g. +919876543210)" }),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters if resetting",
    }),
  is_active: z.boolean(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserEditDialogProps {
  user: User | null;
  open: boolean;
  isAdmin?: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export function UserEditDialog({
  user,
  open,
  isAdmin = false,
  onOpenChange,
  onUserUpdated,
}: UserEditDialogProps) {
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
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      is_active: true,
    },
  });

  // Populate when user changes
  useEffect(() => {
    if (user && open) {
      reset({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        password: "",
        is_active: user.is_active !== undefined ? user.is_active : true,
      });
      setSelectedFile(null);
      setImagePreview(null);
      setApiError(null);
    }
  }, [user, open, reset]);

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

  const handleRemoveNewImage = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const existingProfileUrl = getProfilePictureUrl(user?.profile_picture);
  const displayPreviewUrl = imagePreview || existingProfileUrl;

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;
    setApiError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("email", data.email.trim().toLowerCase());
      formData.append("mobile", data.mobile.trim());

      // Only send is_active if Admin
      if (isAdmin) {
        formData.append("is_active", data.is_active ? "true" : "false");
      }

      if (data.password && data.password.trim().length > 0) {
        formData.append("password", data.password.trim());
      }

      if (selectedFile) {
        formData.append("profile_picture", selectedFile);
      }

      await api.patch(`/users/${user.id}`, formData);

      toast.success(`Profile for "${data.name}" updated successfully.`);
      onOpenChange(false);
      onUserUpdated();
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, "Failed to update profile. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Edit className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">
              {isAdmin ? "Edit User" : "Edit Profile"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {isAdmin
              ? "Update user account information, permissions, or profile image."
              : "Update your personal details, profile picture, or password."}
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
          {/* Profile Picture */}
          <div className="flex flex-col items-center justify-center gap-3 p-3 rounded-xl bg-muted/30 border border-dashed border-border">
            <div className="relative group">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20 shadow-md">
                {displayPreviewUrl ? (
                  <AvatarImage src={displayPreviewUrl} alt="Preview" className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                )}
              </Avatar>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleRemoveNewImage}
                  disabled={isSubmitting}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  title="Undo new selection"
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
                {displayPreviewUrl ? "Replace Photo" : "Upload Photo"}
              </Button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs font-semibold">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="edit-name"
                placeholder="Full Name"
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
            <Label htmlFor="edit-email" className="text-xs font-semibold">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="edit-email"
                type="email"
                placeholder="Email address"
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
            <Label htmlFor="edit-mobile" className="text-xs font-semibold">
              Mobile Number <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="edit-mobile"
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

          {/* Password (Optional Reset) */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-password" className="text-xs font-semibold">
              {isAdmin ? "Reset Password" : "Change Password"}{" "}
              <span className="text-muted-foreground font-normal">(Leave blank to keep unchanged)</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="edit-password"
                type="password"
                placeholder="Enter new password"
                disabled={isSubmitting}
                className={`pl-9.5 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Active Status Switch - ONLY VISIBLE FOR ADMIN */}
          {isAdmin && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
              <div className="space-y-0.5">
                <Label htmlFor="edit-active" className="text-sm font-semibold cursor-pointer">
                  Account Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isActive ? "Account is active and can log in" : "Account is inactive / locked"}
                </p>
              </div>
              <Switch
                id="edit-active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
                disabled={isSubmitting}
              />
            </div>
          )}

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
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
