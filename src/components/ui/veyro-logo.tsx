"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function VeyroLogo({ className = "h-10" }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show light mode logo by default during SSR to prevent hydration mismatch
  const logoSrc = mounted && resolvedTheme === "dark"
    ? "/VeriMedrix Dark Mode Logo.png"
    : "/VeriMedrix Logo.png";

  return (
    <Image
      src={logoSrc}
      alt="VeriMedrix"
      width={300}
      height={80}
      className={`${className} w-auto`}
      priority
    />
  );
}

export function VeyroLogoFull({ className = "h-10" }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show light mode logo by default during SSR to prevent hydration mismatch
  const logoSrc = mounted && resolvedTheme === "dark"
    ? "/VeriMedrix Dark Mode Logo.png"
    : "/VeriMedrix Logo.png";

  return (
    <Image
      src={logoSrc}
      alt="VeriMedrix"
      width={300}
      height={80}
      className={`${className} w-auto`}
      priority
    />
  );
}
