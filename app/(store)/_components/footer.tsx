"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";

import { subscribeToNewsletter } from "@/actions/newsletter";
import { siteConfig, whatsappLink, formatAddress } from "@/lib/site-config";
import { Logo } from "./brand/logo";

const columns = [
  {
    title: "Loja",
    links: [
      { href: "/products", label: "Todos os vestidos" },
      { href: "/category", label: "Ocasiões" },
      { href: "/color", label: "Cores" },
      { href: "/wishlist", label: "Favoritos" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/#como-funciona", label: "Como funciona" },
      { href: "/faq", label: "Perguntas frequentes" },
      { href: "/policies", label: "Política da loja" },
      { href: "/payment-methods", label: "Formas de pagamento" },
      { href: "/contact", label: "Contato" },
    ],
  },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNewsletterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Digite um e-mail válido, como nome@email.com.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await subscribeToNewsletter(email);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Pronto! Você vai receber as novidades da My Dress.");
      setEmail("");
    } catch (error) {
      console.error("Erro ao cadastrar na newsletter:", error);
      toast.error("Não conseguimos cadastrar seu e-mail agora. Tente de novo em instantes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="border-t border-border bg-muted/60 text-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" className="-ml-3 -mt-6 inline-block" aria-label="My Dress Floripa, página inicial">
              <Logo size={140} />
            </Link>
            <p className="mt-0 max-w-sm leading-relaxed text-muted-foreground">{siteConfig.tagline}.</p>

            <form onSubmit={handleNewsletterSubmit} className="mt-8 max-w-sm">
              <label htmlFor="newsletter-email" className="text-[15px] font-medium">
                Receba os lançamentos primeiro
              </label>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-card p-1.5 focus-within:border-primary">
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent px-3 text-[15px] placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                  {isLoading ? "Enviando" : "Quero"}
                </button>
              </div>
            </form>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted-foreground transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold">Fale com a gente</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a
                  href={whatsappLink("Olá! Vim pelo site da My Dress.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3"
                >
                  <FaWhatsapp className="size-5 text-[#1f9d55]" />
                  <span className="text-muted-foreground group-hover:text-foreground tabular-nums">
                    {siteConfig.whatsapp.display}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3"
                >
                  <FaInstagram className="size-5 text-primary" />
                  <span className="text-muted-foreground group-hover:text-foreground">{siteConfig.instagram.handle}</span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3"
                >
                  <MapPin className="mt-0.5 size-5 shrink-0 text-foreground" />
                  <span className="text-muted-foreground group-hover:text-foreground">{formatAddress()}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName || siteConfig.fullName}
            {siteConfig.cnpj && ` · CNPJ ${siteConfig.cnpj}`}
          </p>
          <p>Pagamento seguro com cartão, Pix e boleto.</p>
        </div>
      </div>
    </footer>
  );
};
