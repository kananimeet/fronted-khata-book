import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In | KhataBook",
  description: "Sign in to access your KhataBook dashboard",
};

export default function LoginPage() {
  return <LoginForm />;
}
