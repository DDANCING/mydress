import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MessageSquare, HelpCircle } from "lucide-react";

function SupportPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full bg-transparent px-4 py-12">
      <Card className="w-full max-w-xl shadow-xl rounded-3xl border-none bg-gradient-to-r from-background to-primary/10">
        <CardContent className="text-center py-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2 text-primary">
            <HelpCircle className="w-8 h-8" />
            Suporte e Atendimento
          </h2>
          <p className="text-muted-foreground mb-8">
            Precisa de ajuda? Escolha uma das opções abaixo para entrar em contato com nossa equipe de suporte.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="https://wa.me/5548998359737"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-medium text-lg transition-colors shadow hover:scale-[1.04]"
            >
              <Phone className="h-5 w-5" />
              Falar no WhatsApp
            </a>
            <a
              href="https://www.instagram.com/mydressfloripa/"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-4 rounded-xl font-medium text-lg transition-colors shadow hover:scale-[1.04]"
            >
              <Mail className="h-5 w-5" />
              Chamar no Instagram
            </a>
          </div>
          <div className="mt-10">
            
            <p className="text-xs text-muted-foreground mt-2">
              O ticket será respondido por nossa equipe o mais breve possível.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupportPage;