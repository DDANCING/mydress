import { ArrowUpRight, MapPin } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

import { siteConfig, whatsappLink, formatAddress } from "@/lib/site-config";

export const metadata = {
  title: "Contato",
  description: "Fale com a My Dress Floripa pelo WhatsApp ou Instagram, ou visite nosso provador em Coqueiros, Florianópolis.",
};

const channels = [
  {
    icon: <FaWhatsapp className="size-5 text-[#1f9d55]" />,
    label: "WhatsApp",
    value: siteConfig.whatsapp.display,
    href: whatsappLink("Olá! Vim pelo site da My Dress."),
  },
  {
    icon: <FaInstagram className="size-5 text-primary" />,
    label: "Instagram",
    value: siteConfig.instagram.handle,
    href: siteConfig.instagram.url,
  },
  {
    icon: <MapPin className="size-5 text-foreground" />,
    label: "Provador",
    value: formatAddress(),
    href: siteConfig.address.mapsUrl,
  },
];

const ContactPage = () => {
  return (
    <div className="mx-auto mt-20 max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="font-display text-5xl leading-[1.05] tracking-[-0.02em] sm:text-6xl">Fale com a gente</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
        Dúvidas sobre tamanhos, datas ou para agendar uma prova: chame no WhatsApp que a gente te ajuda a
        escolher o vestido.
      </p>

      <ul className="mt-12 border-t border-border">
        {channels.map((channel) => (
          <li key={channel.label} className="border-b border-border">
            <a
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 py-6"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary">
                {channel.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-muted-foreground">{channel.label}</span>
                <span className="block text-lg text-foreground transition-colors group-hover:text-primary">
                  {channel.value}
                </span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactPage;
