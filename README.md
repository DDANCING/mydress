# My Dress Floripa

Loja online e sistema de gestão da **My Dress Floripa**, aluguel de vestidos de festa em Florianópolis.

- Loja: catálogo de vestidos por ocasião e cor, sacola, checkout (Stripe) e área da cliente
- Dashboard: produtos, contratos de locação em PDF, pagamentos e recibos, agenda, notas fiscais (Focus NFe) e relatórios
- PWA instalável, sitemap e robots gerados automaticamente

## Tecnologias

Next.js 16 (App Router, Turbopack), React 19, Auth.js v5, Prisma (PostgreSQL), Tailwind CSS v4, Stripe, Resend e jsPDF. O projeto roda com **Bun**.

## Rodando localmente

```bash
bun install          # instala dependências e gera o Prisma Client
bun run dev          # http://localhost:3000
```

O Turbopack usa o **Node.js** para processar o CSS, então o `node` precisa estar no PATH do terminal.

## Configuração

Os dados da empresa (nome, CNPJ, endereço, WhatsApp, Instagram, inscrição estadual) ficam em `lib/site-config.ts`.

Variáveis de ambiente (`.env`, nunca versionado):

| Variável | Para que serve |
| --- | --- |
| `DATABASE_URL` | Banco PostgreSQL |
| `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login |
| `NEXT_PUBLIC_APP_URL` | URL pública do site, com `https://` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envio de e-mails (domínio verificado no Resend) |
| `WEEKLY_REPORT_EMAILS` | Destinatários do relatório semanal, separados por vírgula |
| `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` | Pagamentos (veja os eventos do webhook abaixo) |
| `MELHOR_ENVIO_TOKEN` | Cotação de frete real pelo Melhor Envio (opcional; sem ele o site usa uma estimativa por distância) |
| `MELHOR_ENVIO_SANDBOX` | `true` para usar o ambiente de testes do Melhor Envio |
| `MELHOR_ENVIO_CONTACT_EMAIL` | E-mail de contato exigido pelo Melhor Envio no cabeçalho das chamadas |
| `SHIPPING_ORIGIN_CEP` | CEP de onde os vestidos são postados (padrão: endereço da loja em `lib/site-config.ts`) |
| `FOCUS_TOKEN_PRODUCAO`, `FOCUS_TOKEN_HOMOLOGACAO`, `AMBIENTE` | Notas fiscais |
| `CRON_SECRET`, `SYNAPSE_SECRET` | Integrações e tarefas agendadas |
| `GOOGLE_SITE_VERIFICATION` | Verificação do Google Search Console |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Analytics / Google Ads (opcionais) |

## Compras pela loja

Fluxo: produto → carrinho (frete e cupom) → `/api/store/orders` cria o pedido → checkout (dados de entrega) → `/api/checkout` abre o Stripe → webhook confirma.

- Preço, frete, desconto e disponibilidade são sempre recalculados no servidor (`lib/store-orders.ts`). O navegador só envia as escolhas da cliente.
- As regras de reserva (dias de preparação, devolução e conflitos entre aluguel e venda) ficam em `lib/booking-rules.ts` e valem para a página do produto, o carrinho e a API.
- Cada pedido tem uma única data de evento/entrega.

No Stripe Dashboard, o endpoint `/api/webhooks/stripe` precisa receber os eventos:
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` e `checkout.session.expired`.

Para rodar o build de produção localmente (`bun run start`) defina `AUTH_TRUST_HOST=true`; na Vercel isso já é automático.

## Segurança

- **Limite de tentativas** (`lib/rate-limit.ts`): login, código 2FA, cadastro, recuperação de senha, cupons, frete, pedidos, checkout, newsletter e depoimentos. Os contadores ficam na tabela `RateLimit` do Postgres (criada com `prisma db push`), então valem para todas as instâncias da Vercel. O IP vem do `x-forwarded-for`, que a Vercel preenche; fora da Vercel, coloque um proxy que sobrescreva esse cabeçalho.
- **APIs do painel**: o `middleware.ts` libera para clientes só as rotas de `customerApiRoutes` (`routes.ts`). Qualquer outra API fora de `publicRoutes` exige ADMIN, OWNER ou SELLER. As server actions do painel chamam `assertStaff()`.
- **Segredos obrigatórios**: sem `CRON_SECRET` e `SYNAPSE_SECRET` configurados, as rotas de cron e n8n ficam fechadas.
- **Cabeçalhos de segurança**: ficam no `next.config.mjs`, que é o config que o Next carrega (o `next.config.ts` é ignorado enquanto o `.mjs` existir).
