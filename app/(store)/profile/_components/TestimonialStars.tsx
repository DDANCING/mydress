"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createTestimonial, hasTestimonial } from "@/actions/createTestimonial";
import { toast } from "sonner";

interface TestimonialStarsProps {
  productId: string;
  canTestimonial: boolean;
  userId: string;
}

export function TestimonialStars({ productId, canTestimonial, userId }: TestimonialStarsProps) {
  const [selectedStars, setSelectedStars] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);
  const [quote, setQuote] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [hasTestimonials, setHasTestimonials] = React.useState<boolean>(false); // <-- ESTADO CORRETO

  // Verifica se já existe depoimento ao montar/comparar productId/userId
  React.useEffect(() => {
    async function checkHasTestimonial() {
      if (productId && userId) {
        const result = await hasTestimonial({ productId, userId });
        setHasTestimonials(result);
      }
    }
    checkHasTestimonial();
  }, [productId, userId]);

  if (!canTestimonial) return null;

  // Renderiza as estrelas
  const renderStars = ({ disabled }: { disabled: boolean }) => (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          disabled={disabled}
          key={star}
          type="button"
          className={`text-2xl ${selectedStars && star <= selectedStars ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-500 transition`}
          onClick={() => {
            setSelectedStars(star);
            setOpen(true);
            setSuccess(null);
            setError(null);
          }}
          aria-label={`Dar ${star} estrela${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  // Submit do depoimento
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStars || quote.trim().length < 2) {
      setError("Preencha todos os campos!");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Repete verificação antes de enviar
    const alreadySent = await hasTestimonial({ productId, userId });
    if (alreadySent) {
      setLoading(false);
      setError("Você já enviou um depoimento para este produto.");
      toast.error("Você já enviou um depoimento para este produto.");
      setHasTestimonials(true);
      setOpen(false);
      return;
    }

    const res = await createTestimonial({
      productId,
      stars: selectedStars,
      quote,
    });

    setLoading(false);
    if (res?.success) {
      setSuccess("Depoimento enviado com sucesso!");
      setOpen(false);
      setQuote("");
      setSelectedStars(null);
      setHasTestimonials(true); 
      toast.success("Depoimento enviado com sucesso!");
    } else {
      setError(res?.error || "Erro ao enviar depoimento.");
      toast.error(res?.error || "Erro ao enviar depoimento.");
    }
  }

  // Mensagem caso já tenha depoimento
  if (hasTestimonials) {
    return <div className="mt-2 text-emerald-600 text-sm font-semibold">Depoimento já enviado!</div>;
  }

  return (
    <div>
      <span className="text-sm text-gray-700 mr-2">Avalie o produto:</span>
      {renderStars({ disabled: false })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-extralight">Seu depoimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="quote" className="block text-sm mb-1 font-extralight">O que achou do produto?</label>
              <Textarea
                id="quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={4}
                placeholder="Conte sua experiência..."
                required
               
              />
            </div>
            <DialogFooter>
              <Button type="submit" variant="outline" className="font-extralight" disabled={loading}>
                {loading ? "Enviando..." : "Enviar depoimento"}
              </Button>
            </DialogFooter>
            {error && <div className="text-rose-600 text-sm">{error}</div>}
            {success && <div className="text-emerald-600 text-sm">{success}</div>}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}