// Aceita "localhost:3000" ou "www.site.com.br" no .env e devolve uma URL completa, sem barra no final
const normalizeUrl = (value?: string) => {
  const raw = (value || "http://localhost:3000").trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(raw)) return raw;
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw);
  return `${isLocal ? "http" : "https"}://${raw}`;
};

// Dados da marca usados pela loja. Altere aqui para atualizar o site inteiro.
export const siteConfig = {
  name: "My Dress",
  fullName: "My Dress Floripa",
  tagline: "Aluguel de vestidos de festa em Florianópolis",
  mission: "Nossa missão é oferecer a melhor experiência imaginável em alugar um vestido.",
  city: "Florianópolis",
  state: "SC",
  address: {
    street: "Rua Senador Milton Campos, 265",
    district: "Coqueiros",
    city: "Florianópolis",
    state: "SC",
    zip: "88080-110",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Rua+Senador+Milton+Campos+265+Coqueiros+Florian%C3%B3polis+SC",
  },
  whatsapp: {
    number: "5548998359737",
    display: "(48) 99835-9737",
    // Link oficial usado na bio do Instagram
    bioLink: "https://wa.me/message/6NNGCL3AZJNND1",
  },
  instagram: {
    handle: "@mydressfloripa",
    url: "https://www.instagram.com/mydressfloripa/",
  },
  // Dados da Receita Federal (CNPJ 29.662.581/0001-09)
  legalName: "MY DRESS FLORIPA LTDA",
  cnpj: "29.662.581/0001-09",
  // Inscrição estadual (SC) do emitente das notas fiscais. Sem ela a emissão de NF-e fica bloqueada.
  stateRegistration: "",
  // Preencher quando houver
  email: "",
  // Frases da faixa que corre no topo da loja
  announcements: [
    "Nova coleção exclusiva com Cris Mazzonetto",
    "Provador em Coqueiros, Florianópolis",
    "+1.400 avaliações 5 estrelas no Google",
  ],
  // Matérias sobre a loja (seção "Na imprensa" da home)
  press: [
    {
      outlet: "Revista KDEA 360",
      image: "/cmxmydress.png",
      imageAlt: "Cris Mazzonetto e Dani Scottg, de braços cruzados, sob o título Cris Mazzonetto x My Dress",
      date: "26 de outubro de 2026",
      title: "My Dress aposta em parceria com vestidos exclusivos e inaugura nova fase da moda festa em Florianópolis",
      lead: "Em parceria com a estilista Cris Mazzonetto, a empresária Dani Scottg lança uma coleção de 15 modelos com bordados, pedrarias e acabamento sofisticado.",
      quote: "A nova linha leva o conceito de exclusividade para o mercado de locação.",
      url: "https://revistakdea360.com.br/noticia/98397/my-dress-aposta-em-parceria-com-vestidos-exclusivos-e-inaugura-nova-fase-da-moda-festa-em-florianopolis",
    },
  ],
  // URL pública do site (defina NEXT_PUBLIC_APP_URL no .env de produção)
  url: normalizeUrl(process.env.NEXT_PUBLIC_APP_URL),
  // Remetente dos e-mails. O domínio precisa estar verificado no Resend (defina EMAIL_FROM no .env).
  emailFrom: process.env.EMAIL_FROM || "My Dress Floripa <onboarding@resend.dev>",
};

// Destinatários do relatório semanal de agendamentos (WEEKLY_REPORT_EMAILS, separados por vírgula)
export const weeklyReportRecipients = () =>
  (process.env.WEEKLY_REPORT_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

// Texto de identificação da empresa usado em contratos e documentos
export const companyLegalDescription = () => {
  const a = siteConfig.address;
  return `${siteConfig.legalName}, inscrita no CNPJ ${siteConfig.cnpj}, empresa especializada em aluguel de vestidos de festa, com sede na ${a.street} - Bairro ${a.district} - ${a.city}-${a.state}, CEP ${a.zip}, Telefone ${siteConfig.whatsapp.display}.`;
};

export const whatsappLink = (message?: string) =>
  `https://wa.me/${siteConfig.whatsapp.number}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

export const formatAddress = () => {
  const a = siteConfig.address;
  return `${a.street}, ${a.district}, ${a.city} - ${a.state}, ${a.zip}`;
};
