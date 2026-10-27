"use client";

import * as React from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { RoleGateNoMessage } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { LayoutGrid } from "@/public/animated/icons/LayoutGrid";


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
  title?: never;
  icon?: never;
  content?: never;
  href?: never;
  onClick?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
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

export function ExpandableTabs({
  tabs,
  className,
  onChange,
}: ExpandableTabsProps) {
  const pathname = usePathname();
  const [selected, setSelected] = React.useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl p-1",
        className
      )}
    >
      {/* Botão fixo para Dashboard */}
      <RoleGateNoMessage allowedRoles={[UserRole.ADMIN, UserRole.SELLER, UserRole.OWNER]}>
        <motion.button
          key="dashboard"
          variants={buttonVariants}
          initial={false}
          animate="animate"
          custom={false}
          onClick={() => handleSelect(-1)}
          transition={transition}
          className={cn(
            "relative flex items-center overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
            "text-muted-foreground/80 hover:bg-muted hover:text-foreground"
          )}
        >
          <LayoutGrid size={20} />
          <motion.span
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="ml-2 flex items-center gap-1 whitespace-nowrap overflow-hidden"
          >
            <Link href="/dashboard">Dashboard</Link>
          </motion.span>
        </motion.button>
      </RoleGateNoMessage>

      {/* Tabs dinâmicas */}
      {tabs.map((tab, index) => {
        if (tab.type === "separator") return <Separator key={`separator-${index}`} />;

        const Icon = tab.icon;
        const isActive = tab.href === pathname;
        const isSelected = selected === index;

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
    </div>
  );
}