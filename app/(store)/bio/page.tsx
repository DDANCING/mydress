"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Download, MapPin, ShoppingBag } from 'lucide-react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';

import { siteConfig, whatsappLink } from '@/lib/site-config';
import { LogoMark } from '../_components/brand/logo';

const container = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

const links = [
  {
    href: whatsappLink('Olá! Gostaria de agendar uma prova de vestido.'),
    icon: <FaWhatsapp className="size-5 text-[#1f9d55]" />,
    label: 'Agendar prova',
    external: true,
    primary: true,
  },
  {
    href: '/products',
    icon: <ShoppingBag className="size-5" />,
    label: 'Ver vestidos para alugar',
    external: false,
  },
  {
    href: siteConfig.instagram.url,
    icon: <FaInstagram className="size-5" />,
    label: 'Instagram',
    external: true,
  },
  {
    href: siteConfig.address.mapsUrl,
    icon: <MapPin className="size-5" />,
    label: `Provador em ${siteConfig.address.district}`,
    external: true,
  },
];

export default function BioPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/60 px-4 pb-16 pt-28">
      <motion.div variants={container} initial="initial" animate="animate" className="w-full max-w-sm text-center">
        <motion.div variants={item} className="flex flex-col items-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-card">
            <LogoMark className="size-11 text-primary" />
          </span>
          <h1 className="mt-5 font-display text-4xl tracking-[-0.02em]">{siteConfig.fullName}</h1>
          <p className="mt-2 text-muted-foreground">{siteConfig.tagline}</p>
        </motion.div>

        <ul className="mt-10 space-y-3">
          {links.map((link) => (
            <motion.li key={link.label} variants={item}>
              <Link
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className={
                  link.primary
                    ? 'group flex h-14 items-center gap-3 rounded-full bg-primary px-5 text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 [&_svg]:text-primary-foreground'
                    : 'group flex h-14 items-center gap-3 rounded-full bg-card px-5 text-foreground transition-transform duration-300 hover:-translate-y-0.5'
                }
              >
                {link.icon}
                <span className="flex-1 text-left font-medium">{link.label}</span>
                <ArrowUpRight className="size-4 opacity-60 transition-opacity group-hover:opacity-100" />
              </Link>
            </motion.li>
          ))}

          {showInstall && (
            <motion.li variants={item}>
              <button
                onClick={handleInstall}
                className="flex h-14 w-full items-center gap-3 rounded-full border border-border px-5 text-foreground transition-colors hover:bg-card"
              >
                <Download className="size-5" />
                <span className="flex-1 text-left font-medium">Adicionar à tela inicial</span>
              </button>
            </motion.li>
          )}
        </ul>

        <motion.p variants={item} className="mt-12 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.fullName}
        </motion.p>
      </motion.div>
    </div>
  );
}
