"use client";

import { Header } from "@/components/auth/header";
import { Social } from "@/components/auth/social";
import { BackButton } from "@/components/auth/back-button";
import { Separator } from "../ui/separator";

interface CardWrapperProps {
  children?: React.ReactNode;
  headerLabel: string;
  description?: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
};

export const CardWrapper = ({
  children,
  headerLabel,
  description,
  backButtonLabel,
  backButtonHref,
  showSocial
}: CardWrapperProps) => {
  return (
    <div className="w-full">
      <Header label={headerLabel} description={description} />

      <div className="mt-8">{children}</div>

      {showSocial && (
        <div className="mt-6 space-y-6">
          <Separator withText text="ou" />
          <Social />
        </div>
      )}

      {backButtonLabel && (
        <div className="mt-8 border-t border-border pt-6">
          <BackButton label={backButtonLabel} href={backButtonHref} />
        </div>
      )}
    </div>
  );
};
