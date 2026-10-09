"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
  iconClassName?: string;
  href?: string;
}

const sizeMap = {
  xs: { icon: "h-7 w-7", img: 28, text: "text-sm", sub: "text-[9px]" },
  sm: { icon: "h-9 w-9", img: 36, text: "text-base", sub: "text-[10px]" },
  md: { icon: "h-11 w-11", img: 44, text: "text-lg", sub: "text-[11px]" },
  lg: { icon: "h-14 w-14", img: 56, text: "text-xl", sub: "text-xs" },
  xl: { icon: "h-20 w-20", img: 80, text: "text-2xl", sub: "text-sm" },
};

export function KhataBookLogo({
  size = "md",
  showText = true,
  subtitle = "Room & Expense Hub",
  className,
  iconClassName,
  href,
}: LogoProps) {
  const currentSize = sizeMap[size];

  const content = (
    <div className={cn("inline-flex items-center gap-3 select-none group", className)}>
      {/* 3D Glassmorphic App Icon Emblem */}
      <div
        className={cn(
          "relative shrink-0 rounded-2xl p-0.5 overflow-hidden transition-all duration-300",
          "shadow-md shadow-violet-500/20 group-hover:shadow-lg group-hover:shadow-violet-500/35 group-hover:scale-105",
          currentSize.icon,
          iconClassName
        )}
      >
        <Image
          src="/icons/logo.svg"
          alt="KhataBook Logo"
          width={currentSize.img}
          height={currentSize.img}
          priority
          className="h-full w-full object-contain rounded-2xl"
        />
      </div>

      {/* Styled Brand Wordmark */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-300 dark:to-fuchsia-400 bg-clip-text text-transparent truncate",
                currentSize.text
              )}
            >
              KhataBook
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
          </div>
          {subtitle && (
            <span
              className={cn(
                "font-medium text-muted-foreground -mt-0.5 tracking-wide truncate",
                currentSize.sub
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
