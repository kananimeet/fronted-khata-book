import { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Portal Login | Bachelors Book",
  description: "Sign in with your administrative credentials to manage Bachelors Book",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
