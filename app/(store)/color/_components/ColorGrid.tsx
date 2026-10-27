'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface ColorGridProps {
  color: {
    id: string;
    name: string;
    value: string;
  }[];
}

export default function ColorGrid({ color }: ColorGridProps) {
const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 }
};
  return (
    <>
      {/* Navegação */}
      <Breadcrumb className="mt-24 mx-4 md:mx-16 mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cores</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Container responsivo */}
      <div className="grid grid-cols-1 md:flex bg-background overflow-hidden gap-4 px-4 md:px-0 md:mx-16  mb-20">
        {color.map((color, index) => (
          <motion.div
            key={color.id}
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0, y: -20 },
              animate: {
                opacity: 1,
                y: 0,
                transition: { delay: index / 3 }
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-full aspect-video md:aspect-auto md:h-[80vh] mx-auto group "
          >
            <Link href={`/color/${color.id}`}>
             <div className="w-full h-full rounded-md" style={{ backgroundColor: color.value }} />
              <div className="bg-muted/50 p-2 rounded-xl absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-foreground text-lg font-semibold">
                {color.name}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
