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
| `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` | Pagamentos |
| `FOCUS_TOKEN_PRODUCAO`, `FOCUS_TOKEN_HOMOLOGACAO`, `AMBIENTE` | Notas fiscais |
| `CRON_SECRET`, `SYNAPSE_SECRET` | Integrações e tarefas agendadas |
| `GOOGLE_SITE_VERIFICATION` | Verificação do Google Search Console |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Analytics / Google Ads (opcionais) |
