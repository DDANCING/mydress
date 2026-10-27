import { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  Shield, 
  CreditCard,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Truck,
  Globe
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Perguntas Frequentes (FAQ)',
  description: 'Encontre respostas para as principais dúvidas sobre produtos, pagamentos, entregas, trocas e devoluções na My Dress Floripa.',
  keywords: 'FAQ, perguntas frequentes, dúvidas, suporte, ajuda, atendimento, my dress floripa, aluguel de vestidos florianópolis',
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background mt-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Perguntas Frequentes
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas rápidas para suas principais dúvidas sobre nossos produtos e serviços
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Contact Quick Actions */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Precisa de Ajuda Personalizada?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="https://wa.me/5548998359737"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">(48) 99835-9737</p>
                </div>
              </a>
              <a
                href="https://www.instagram.com/mydressfloripa/"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Instagram</p>
                  <p className="text-sm text-muted-foreground">@mydressfloripa</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Horário</p>
                  <p className="text-sm text-muted-foreground">Seg-Sex: 9h às 18h</p>
                  <p className="text-sm text-muted-foreground">Sab: 9h às 13h</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {/* Produtos */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">

              <AccordionItem value="produtos-2" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Como funcionam os produtos &ldquo;Sob Medida&rdquo;?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Para produtos &ldquo;Sob Medida&rdquo;, você é responsável por fornecer suas medidas exatas seguindo 
                  nosso guia de medição disponível no site. O ateliê confeccionará a peça baseada 
                  estritamente nas medidas informadas. Ajustes necessários após o recebimento, 
                  decorrentes de medição incorreta, serão de sua responsabilidade e custo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="produtos-3" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Como escolher o tamanho correto em produtos de &ldquo;Tamanho Padrão&rdquo;?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Para produtos de &ldquo;Tamanho Padrão&rdquo; (P, M, G, etc.), consulte nossa tabela de medidas 
                  detalhada disponível na página de cada produto. A responsabilidade pela escolha 
                  correta do tamanho é sua. Recomendamos comparar suas medidas com nossa tabela 
                  antes de finalizar a compra.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="produtos-4" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Qual a diferença entre venda e locação?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-3">
                    <div>
                      <Badge variant="outline" className="mb-2">Venda</Badge>
                      <p>O produto se torna seu definitivamente. Disponível para produtos sob medida e tamanho padrão.</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Locação</Badge>
                      <p>Você aluga o produto por um período determinado. Disponível apenas para produtos de tamanho padrão, sem ajustes à distância.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <Separator />

          {/* Pagamentos */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Pagamentos</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="pagamento-1" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Quais métodos de pagamento vocês aceitam?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Aceitamos diversos métodos de pagamento:
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li><strong>Cartões:</strong> Visa, Mastercard, American Express, Maestro, Diners Club, Discover</li>
                    <li><strong>Carteiras digitais:</strong> Apple Pay, Google Pay</li>
                    <li><strong>Métodos brasileiros:</strong> Pix (instantâneo) e Boleto Bancário</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pagamento-2" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Meus dados de pagamento estão seguros?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      Absolutamente! Utilizamos a Stripe, uma das plataformas de pagamento mais seguras do mundo. 
                      Todos os dados são criptografados com SSL 256-bit e somos certificados PCI DSS. 
                      Não armazenamos informações de cartão em nossos servidores.
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pagamento-3" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Quanto tempo demora para aprovar o pagamento?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span><strong>Cartões e carteiras digitais:</strong> Aprovação instantânea</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span><strong>Pix:</strong> Aprovação imediata</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span><strong>Boleto:</strong> Até 2 dias úteis após o pagamento</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pagamento-4" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Posso parcelar minha compra?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O parcelamento depende das políticas do seu cartão de crédito e do valor da compra. 
                  As opções disponíveis aparecerão automaticamente durante o checkout. 
                  O Pix e boleto são sempre à vista.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pagamento-5" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  O que fazer se o pagamento for recusado?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-2">
                    <p>Principais causas e soluções:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Verifique se os dados do cartão estão corretos</li>
                      <li>Confirme se há limite disponível</li>
                      <li>Tente outro cartão ou método de pagamento</li>
                      <li>Entre em contato com seu banco</li>
                      <li>Use Pix como alternativa rápida</li>
                    </ul>
                    <p className="mt-2 text-sm">Se persistir, entre em contato conosco pelo WhatsApp.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <Separator />

          {/* Entrega e Frete */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Truck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Entrega e Frete</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="entrega-1" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Como é calculado o prazo de entrega?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O prazo de entrega é uma estimativa fornecida pela transportadora e começa a contar:
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li><strong>Produtos prontos:</strong> A partir da confirmação do pagamento</li>
                    <li><strong>Produtos sob encomenda:</strong> A partir do fim do prazo de confecção</li>
                  </ul>
                  <p className="mt-2">Os prazos variam de 2 a 20 dias úteis dependendo da localização e modalidade escolhida (PAC/SEDEX).</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="entrega-2" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Vocês se responsabilizam por atrasos na entrega?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Não nos responsabilizamos por atrasos causados por greves, desastres naturais ou 
                  outros fatores de responsabilidade da transportadora (Correios, etc.). 
                  Em caso de atraso, você pode acompanhar o pedido através do código de rastreamento.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="entrega-3" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  E se eu fornecer o endereço errado?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Você é responsável por fornecer o endereço correto e completo. 
                  Caso a encomenda retorne por erro no endereço ou ausência do destinatário, 
                  o custo do reenvio será de sua responsabilidade.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="entrega-4" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Como funcionam os envios internacionais?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 text-blue-600 inline mr-2" />
                    <strong>Importante:</strong> Para envios internacionais, todas as taxas de importação, 
                    impostos alfandegários e encargos de desembaraço aduaneiro do país de destino 
                    são de sua inteira responsabilidade. O Ateliê não tem controle sobre esses valores.
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <Separator />

          {/* Trocas e Devoluções */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <RefreshCw className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Trocas e Devoluções</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="devolucao-1" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Posso devolver produtos que não me serviram?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <CheckCircle className="h-4 w-4 text-green-600 inline mr-2" />
                      <strong>Produtos de tamanho padrão:</strong> Você tem 7 dias corridos após o recebimento 
                      para devolver conforme o Código de Defesa do Consumidor.
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 text-red-600 inline mr-2" />
                      <strong>Produtos sob medida:</strong> Não podem ser devolvidos, pois são feitos 
                      especificamente para você, impossibilitando a revenda.
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="devolucao-2" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Como solicitar uma devolução?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Para devoluções válidas (produtos não personalizados):
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    <li>Entre em contato por email em até 7 dias corridos</li>
                    <li>O produto deve estar na embalagem original</li>
                    <li>Sem indícios de uso, com lacre e etiqueta intactos</li>
                    <li>Acompanhado de todos os acessórios</li>
                    <li>O frete de devolução é de sua responsabilidade</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="devolucao-3" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Como funciona a devolução de produtos alugados?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-3">
                    <p>Para locações, você deve:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Postar o traje no primeiro dia útil após o evento</li>
                      <li>Usar a embalagem e etiqueta pré-paga fornecidas</li>
                      <li>Enviar o comprovante de postagem por email</li>
                    </ul>
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 text-orange-600 inline mr-2" />
                      <strong>Multa por atraso:</strong> 20% do valor da locação por dia de atraso.
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="devolucao-4" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  E se o produto alugado for danificado?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-3">
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <strong>Danos leves/sujeira:</strong> Taxa de reparo/limpeza a partir de R$ 200,00
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <strong>Dano irreparável/extravio:</strong> Pagamento do valor integral de venda, 
                      descontado o valor já pago pela locação
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <Separator />

          {/* Atendimento */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Atendimento</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="atendimento-1" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Qual o horário de atendimento?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span><strong>Segunda a Sexta:</strong> 9h às 18h</span>
                  </div>
                  <p className="mt-2">Emails enviados fora do horário comercial são respondidos no próximo dia útil.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="atendimento-2" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Qual a melhor forma de entrar em contato?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span><strong>WhatsApp (48) 99835-9737:</strong> Resposta mais rápida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span><strong>Instagram:</strong> @mydressfloripa</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="atendimento-3" className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  Onde vocês estão localizados?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-1">
                    <p><strong>My Dress Floripa</strong></p>
                    <p>Rua Senador Milton Campos, 265 - Coqueiros, Florianópolis - SC, 88080-110</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>

        {/* Final CTA */}
        <Card className="mt-12 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold mb-4">Não encontrou sua resposta?</h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está sempre pronta para ajudar você com qualquer dúvida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/5548998359737"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Phone className="h-4 w-4" />
                Falar no WhatsApp
              </a>
              <a
                href="https://www.instagram.com/mydressfloripa/"
                className="inline-flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Mail className="h-4 w-4" />
                Chamar no Instagram
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
