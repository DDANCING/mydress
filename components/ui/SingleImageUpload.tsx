"use client";

import { Button } from "@/components/ui/button";
import { ImagePlusIcon, Trash } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { useTheme } from "next-themes";

interface SingleImageUploadProps {
  value?: string; // URL da imagem atual
  onChange: (url: string) => void;
  disable?: boolean;
  className?: string;
  label?: string;
}

const  SingleImageUpload: React.FC<SingleImageUploadProps> = ({
  value,
  onChange,
  disable,
  className,
  label = "Nova Imagem",
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const paletteDark = {
    window: "#1e1e1e",
    sourceBg: "#2e2e2e",
    windowBorder: "#000000",
    tabIcon: "#FFFFFF",
    textDark: "#FFFFFF",
    link: "#00BFFF",
    action: "#FF620C",
    inactiveTabIcon: "#888888",
    error: "#F44235",
    inProgress: "#0078FF",
    complete: "#20B832",
    progressCircle: "#0078FF",
    browseButton: "#FF620C",
  };

  const paletteLight = {
    window: "#FFFFFF",
    sourceBg: "#F5F5F5",
    windowBorder: "#DDDDDD",
    tabIcon: "#000000",
    textDark: "#000000",
    link: "#0078FF",
    action: "#0078FF",
    inactiveTabIcon: "#888888",
    error: "#F44235",
    inProgress: "#0078FF",
    complete: "#20B832",
    progressCircle: "#0078FF",
    browseButton: "#0078FF",
  };

  if (!isMounted) return null;

  const handleUpload = (result: any) => {
    const url = result.info.secure_url;
    onChange(url);
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ""}`}>
      <div className="relative w-32 h-32 rounded-full overflow-hidden border">
        {value ? (
          <>
            <Image
              src={value}
              alt="Imagem do usuário"
              fill
              className="object-cover"
            />
            <Button
              type="button"
              onClick={handleRemove}
              variant="destructive"
              size="icon"
              className="absolute top-1/3 left-1/3 p-1 opacity-0 hover:opacity-100"
              disabled={disable}
              aria-label="Remover imagem"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-muted">
            <span className="text-muted-foreground text-xs">Sem imagem</span>
          </div>
        )}
      </div>
      <CldUploadWidget
        onSuccess={handleUpload}
        uploadPreset="eccomercepreset"
        options={{
          multiple: false,
          maxFiles: 1,
          styles: {
            palette: theme === "dark" ? paletteDark : paletteLight,
          },
        }}
      >
        {({ open }) => (
          <Button
            type="button"
            disabled={disable}
            variant="ghost"
            onClick={() => open?.()}
          >
            <ImagePlusIcon className="h-4 w-4" />
            {label}
          </Button>
        )}
      </CldUploadWidget>
    </div>
  );
};

export default SingleImageUpload;