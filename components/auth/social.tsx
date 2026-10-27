"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useSearchParams } from "next/navigation";

import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const onClick = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
  };

  return (
    <button
      type="button"
      onClick={() => onClick("google")}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-card text-[15px] font-medium text-foreground transition-colors hover:bg-secondary"
    >
      <FcGoogle className="size-5" />
      Continuar com Google
    </button>
  );
};
