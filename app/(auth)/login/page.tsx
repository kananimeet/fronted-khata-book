import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In | Bachelors Book",
  description: "Sign in to access your Bachelors Book dashboard",
};

export default function LoginPage() {
  return <LoginForm />;
}
