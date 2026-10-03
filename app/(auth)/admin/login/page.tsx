import { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Portal Login | KhataBook",
  description: "Sign in with your administrative credentials to manage KhataBook",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
