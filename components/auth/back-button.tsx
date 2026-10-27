"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BackButtonProps {
  href: string;
  label: string;
}

export const BackButton = ({ href, label }: BackButtonProps) => {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground underline decoration-primary/40 underline-offset-[6px] transition-colors hover:decoration-primary"
    >
      {label}
      <ArrowRight className="size-4 text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
};
