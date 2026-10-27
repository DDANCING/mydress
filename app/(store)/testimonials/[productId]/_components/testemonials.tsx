"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Ícone de loading

type TestimonialProps = {
  productName: string;
  productId: string;
};

export const Testimonials = ({ productName, productId }: TestimonialProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [stars, setStars] = useState(Number(searchParams.get("stars")) || 0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // loading inicial
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    document.title = `Avalie sua compra (${stars} estrelas)`;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = "Conte-nos como foi sua experiência de compra. Avalie com estrelas.";

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, [stars]);

  useEffect(() => {
  const checkIfReviewed = async () => {
    try {
      const res = await fetch(`/api/testimonials?productId=${productId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 400) {
        setAlreadyReviewed(true);
    } else if (res.status === 401) {
      toast.error("Você precisa estar autenticado para avaliar.");
    } else if (!res.ok) {
      toast.error("Erro ao verificar avaliações anteriores.");
    }
  } catch (err) {
    toast.error("Erro de conexão ao verificar avaliações.");
  } finally {
    setChecking(false);
    }
  };

  checkIfReviewed();
}, [productId]);

  const handleSelect = (n: number) => {
    setStars(n);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("stars", String(n));
    router.replace(`?${sp.toString()}`);
  };

  const handleSubmit = async () => {
    if (!stars || message.trim() === "")
      return toast("Por favor, avalie e escreva um comentário.");

    try {
      setLoading(true);
      await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, stars, message }),
      });
      toast.success("Avaliação enviada com sucesso!");
      setAlreadyReviewed(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <main className="flex items-center justify-center mt-24">
        <section className="flex w-full flex-col items-center justify-center container py-12">
          <Card className="max-w-lg bg-transparent border-none text-center">
            <CardHeader>
              <h1 className="text-2xl font-semibold">Obrigado pela avaliação!</h1>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">{productName}</p>
              <div className="flex justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-8 h-8 ${i < stars ? "text-primary" : "text-muted-foreground"}`}
                    fill={i < stars ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="mt-4 text-muted-foreground">
                Sua opinião é muito importante para nós.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground mt-24">
      <section className="flex flex-col items-center justify-center lg:flex-row container gap-8 py-12 min-w-screen">
        <Card className="max-w-2xl flex-1 bg-transparent border-none">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Avalie seu pedido</h1>
            <div className="flex-1 mx-auto text-center">
              <h1 className="text-2xl font-semibold tracking-tight">{productName}</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6 text-muted-foreground">
              Clique nas estrelas e escreva seu comentário.
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => handleSelect(n)} className="p-1">
                  <Star
                    className={`w-10 h-10 ${n <= stars ? "text-primary" : "text-muted-foreground"}`}
                    fill={n <= stars ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mb-4">
              Sua avaliação: {stars || 0} estrela{stars > 1 ? "s" : ""}.
            </p>
            <Input
              placeholder="Escreva seu depoimento..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mb-4"
            />
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full hover:opacity-90"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {loading ? "Enviando..." : "Enviar avaliação"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};
