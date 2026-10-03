import React from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background selection:bg-primary selection:text-primary-foreground overflow-hidden">
      {/* Background radial gradient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.25),rgba(0,0,0,0))] pointer-events-none" />

      {/* Decorative ambient animated glowing blurs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-primary/20 to-sky-400/20 blur-3xl pointer-events-none animate-float" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none animate-float [animation-delay:4s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none animate-pulse-subtle" />

      {/* Subtle modern dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <div className="rounded-full bg-card/60 backdrop-blur-md border border-border/50 p-1 shadow-xs">
          <ThemeToggle />
        </div>
      </div>

      {/* Main card container */}
      <div className="w-full max-w-md z-10 my-auto py-6">{children}</div>

      {/* Bottom Footer */}
      <div className="relative z-10 mt-auto py-4 text-center text-xs text-muted-foreground/80 flex items-center justify-center gap-2">
        <span>© {new Date().getFullYear()} KhataBook</span>
        <span>•</span>
        <span className="font-medium">Secure Financial Platform</span>
      </div>
    </div>
  );
}
