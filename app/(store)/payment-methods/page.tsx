import { Metadata } from 'next';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover, FaCcDinersClub, FaApplePay, FaGooglePay } from "react-icons/fa";
import { SiMetro } from "react-icons/si";
import { BsQrCode, BsShieldCheck } from "react-icons/bs";
import { PiBarcodeBold } from "react-icons/pi";
import { MdOutlineSecurity, MdVerifiedUser } from "react-icons/md";
import { AiOutlineClockCircle } from "react-icons/ai";
import { BiMoney } from "react-icons/bi";

export const metadata: Metadata = {
  title: 'Métodos de Pagamento',
  description: 'Conheça todos os métodos de pagamento aceitos pela My Dress Floripa. Cartões de crédito, Apple Pay, Google Pay, Pix e Boleto.',
  keywords: 'métodos de pagamento, cartão de crédito, pix, boleto, apple pay, google pay, stripe, pagamento seguro',
};

export default function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-background mt-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Métodos de Pagamento
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Oferecemos diversas opções de pagamento seguras e confiáveis para sua comodidade
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Segurança Section */}
        <div className="mb-16 text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <MdOutlineSecurity className="text-4xl text-primary" />
            <h2 className="text-3xl font-bold text-foreground">
              Pagamentos 100% Seguros
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-8">
            Todos os pagamentos são processados pela Stripe, uma das plataformas de pagamento mais seguras do mundo. 
            Seus dados são protegidos com criptografia SSL 256-bit.
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BsShieldCheck className="text-green-500" />
              <span>SSL 256-bit</span>
            </div>
            <div className="flex items-center gap-2">
              <MdVerifiedUser className="text-green-500" />
              <span>PCI DSS Certificado</span>
            </div>
          </div>
        </div>

        {/* Cartões de Crédito */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-primary rounded"></div>
            Cartões de Crédito e Débito
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Bandeiras Aceitas</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col items-center p-3 border rounded-lg">
                  <FaCcVisa className="text-3xl text-blue-600 mb-2" />
                  <span className="text-sm font-medium">Visa</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-lg">
                  <FaCcMastercard className="text-3xl text-red-500 mb-2" />
                  <span className="text-sm font-medium">Mastercard</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-lg">
                  <FaCcAmex className="text-3xl text-blue-500 mb-2" />
                  <span className="text-sm font-medium">American Express</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-lg">
                  <SiMetro className="text-3xl text-red-600 mb-2" />
                  <span className="text-sm font-medium">Maestro</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-lg">
                  <FaCcDinersClub className="text-3xl text-blue-700 mb-2" />
                  <span className="text-sm font-medium">Diners Club</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-lg">
                  <FaCcDiscover className="text-3xl text-orange-500 mb-2" />
                  <span className="text-sm font-medium">Discover</span>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Informações Importantes</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AiOutlineClockCircle className="text-primary mt-1 flex-shrink-0" />
                  <span>Aprovação instantânea para a maioria dos cartões</span>
                </li>
                <li className="flex items-start gap-2">
                  <BsShieldCheck className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Ambiente 100% seguro com criptografia SSL</span>
                </li>
                <li className="flex items-start gap-2">
                  <BiMoney className="text-primary mt-1 flex-shrink-0" />
                  <span>Parcelamento disponível conforme política do cartão</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Carteiras Digitais */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-primary rounded"></div>
            Carteiras Digitais
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <FaApplePay className="text-4xl text-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Apple Pay</h3>
                  <p className="text-sm text-muted-foreground">Para dispositivos Apple</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Pagamento rápido e seguro</li>
                <li>• Autenticação biométrica</li>
                <li>• Disponível no Safari (iOS/macOS)</li>
              </ul>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <FaGooglePay className="text-4xl text-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Google Pay</h3>
                  <p className="text-sm text-muted-foreground">Para dispositivos Android</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Checkout em um toque</li>
                <li>• Dados protegidos pela Google</li>
                <li>• Disponível no Chrome</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Métodos Brasileiros */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-primary rounded"></div>
            Métodos de Pagamento Brasileiros
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <BsQrCode className="text-4xl text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Pix</h3>
                  <p className="text-sm text-muted-foreground">Transferência instantânea</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                <li>• Pagamento aprovado na hora</li>
                <li>• Disponível 24h, todos os dias</li>
                <li>• QR Code ou código para copiar e colar</li>
                <li>• Sem taxas adicionais</li>
              </ul>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  ⚡ Aprovação instantânea
                </p>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <PiBarcodeBold className="text-4xl text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Boleto Bancário</h3>
                  <p className="text-sm text-muted-foreground">Pagamento tradicional</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                <li>• Pagamento em qualquer banco ou app</li>
                <li>• Vencimento em até 3 dias úteis</li>
                <li>• Aprovação em até 2 dias úteis após pagamento</li>
                <li>• Ideal para quem não tem cartão</li>
              </ul>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  📄 Envio por email após a compra
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-card border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Perguntas Frequentes</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Meus dados estão seguros?
              </h3>
              <p className="text-muted-foreground">
                Sim! Utilizamos a Stripe, uma das plataformas de pagamento mais seguras do mundo. 
                Todos os dados são criptografados com SSL 256-bit e não armazenamos informações de cartão.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Quanto tempo demora para aprovar o pagamento?
              </h3>
              <p className="text-muted-foreground">
                Cartões e carteiras digitais: aprovação instantânea. 
                Pix: aprovação imediata. 
                Boleto: até 2 dias úteis após o pagamento.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Posso parcelar minha compra?
              </h3>
              <p className="text-muted-foreground">
                O parcelamento depende das políticas do seu cartão de crédito e do valor da compra. 
                As opções disponíveis aparecerão durante o checkout.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                O que fazer se o pagamento for recusado?
              </h3>
              <p className="text-muted-foreground">
                Verifique os dados do cartão, limite disponível ou tente outro método de pagamento. 
                Em caso de dúvidas, entre em contato conosco pelo WhatsApp: (48) 99835-9737.
              </p>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Ainda tem dúvidas sobre pagamentos?
          </h3>
          <p className="text-muted-foreground mb-6">
            Nossa equipe está pronta para ajudar você
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5548998359737"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              WhatsApp: (48) 99835-9737
            </a>
            <a
              href="https://www.instagram.com/mydressfloripa/"
              className="border border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
            >
              @mydressfloripa
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
