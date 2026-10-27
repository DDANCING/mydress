"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/login-button";
import { RegisterButton } from "@/components/auth/register-button";
import { usePathname } from "next/navigation";
import { LogIn, LucideIcon, UserRoundPlus } from "lucide-react";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number }>;

interface Tab {
  title: string;
  icon: IconComponent;
  href?: string;
  onClick?: () => void;
  content?: React.ReactNode;
  type?: never;
}


interface Separator {
  type: "separator";
}

type TabItem = Tab | Separator;

interface LoginExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const contentVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition: Transition = {
  delay: 0.1,
  type: "spring",
  bounce: 0,
  duration: 0.6,
};

export function LoginExpandableTabs({
  tabs,
  className,
}: LoginExpandableTabsProps) {
  const pathname = usePathname();
  const [selected, setSelected] = React.useState<number | null>(null);

  const handleSelect = (index: number | null) => {
  setSelected(index);
};

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-2xl p-1", className)}>

      {/* Tabs dinâmicas */}
      {tabs.map((tab, index) => {
        if ("type" in tab && tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const isSelected = selected === index;
        const isActive = tab.href === pathname;
        const Icon = tab.icon;

        const handleClick = () => {
          handleSelect(index);
          tab.onClick?.();
        };

        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={handleClick}
            transition={transition}
            className={cn(
              "relative flex items-center overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
              isSelected
                ? "bg-muted/50 backdrop-blur-xl text-foreground"
                : "text-muted-foreground/80 hover:bg-muted hover:text-foreground",
              isActive && "text-foreground"
            )}
          >
            <Icon size={20} />
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="ml-2 flex items-center gap-1 whitespace-nowrap overflow-hidden"
                >
                  {tab.href && !tab.onClick ? (
                    <Link href={tab.href}>{tab.title}</Link>
                  ) : (
                    tab.content ?? tab.title
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}

        {/* Botões de autenticação */}
              {/* Botão Entrar */}
{/* Botão Entrar */}
<LoginButton mode="modal" asChild>
  <motion.button
    key="login"
    variants={buttonVariants}
    initial={false}
    animate="animate"
    custom={selected === -1}
    onClick={(e) => {
      e.stopPropagation();
      handleSelect(selected === -1 ? null : -1);
    }}
    transition={transition}
    className={cn(
      "relative flex items-center overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
      selected === -1
        ? "bg-muted/50 backdrop-blur-xl text-foreground"
        : "text-muted-foreground/80 hover:bg-muted hover:text-foreground"
    )}
  >
    <LogIn size={20} />
    <AnimatePresence initial={false}>
      {selected === -1 && (
        <motion.span
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className="ml-2 flex items-center gap-1 whitespace-nowrap overflow-hidden"
        >
          Entrar
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
</LoginButton>

{/* Botão Criar Conta */}
<RegisterButton mode="modal" asChild>
  <motion.button
    key="register"
    variants={buttonVariants}
    initial={false}
    animate="animate"
    custom={selected === -2}
    onClick={(e) => {
      e.stopPropagation();
      handleSelect(selected === -2 ? null : -2);
    }}
    transition={transition}
    className={cn(
      "relative flex items-center overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
      selected === -2
        ? "bg-muted/50 backdrop-blur-xl text-foreground"
        : "text-muted-foreground/80 hover:bg-muted hover:text-foreground"
    )}
  >
    <UserRoundPlus size={20} />
    <AnimatePresence initial={false}>
      {selected === -2 && (
        <motion.span
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className="ml-2 flex items-center gap-1 whitespace-nowrap overflow-hidden"
        >
          Criar Conta
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
</RegisterButton>
      
    </div>
  );
}
