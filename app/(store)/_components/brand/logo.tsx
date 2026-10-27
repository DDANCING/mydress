import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

interface LogoMarkProps {
  className?: string;
}

// O logo.svg (cabide + "My Dress Floripa") é monocromático; usamos como máscara
// para que ele herde a cor do texto (text-primary, text-foreground...).
export const LogoMark = ({ className }: LogoMarkProps) => (
  <span
    aria-hidden
    className={cn("inline-block aspect-square shrink-0 bg-current", className)}
    style={{
      maskImage: "url(/logo.svg)",
      WebkitMaskImage: "url(/logo.svg)",
      maskSize: "contain",
      WebkitMaskSize: "contain",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }}
  />
);

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo = ({ className, size = 80 }: LogoProps) => (
  <span
    className={cn("inline-flex shrink-0 items-center text-primary", className)}
    style={{ width: size, height: size }}
  >
    <LogoMark className="size-full" />
    <span className="sr-only">{siteConfig.fullName}</span>
  </span>
);
