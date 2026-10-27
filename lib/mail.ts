import { siteConfig } from "@/lib/site-config";

import { resend } from "@/lib/resend";

export const sendTwoFactorTokenEmail = async (
  email: string,
  token: string
) => {
  await resend.emails.send({
    from: siteConfig.emailFrom,
    to: email,
    subject: "2FA code",
    html: `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Seu código de verificação</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0; padding:0; background:#000000;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000; min-height:100vh; width:100%;">
      <tr>
        <td align="center" style="padding:32px 8px;">
          <!-- Logo fora do card -->
          <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752878414/ky6pwqqthd899jnmbem4.png" alt="Logo" style="max-width:200px; height:auto; display:block; margin:0 auto 24px auto;" />
          
          <table cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; max-width:420px; width:100%; box-shadow:0 2px 16px rgba(0,0,0,0.08); padding:32px 24px; font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <h1 style="font-size:22px; color:#333333; margin:0 0 8px 0; font-weight:bold;">Código de Autenticação</h1>
              </td>
            </tr>
            <tr>
              <td style="color:#333333; font-size:16px; line-height:1.6; padding-bottom:24px; text-align:center;">
                Use o código abaixo para concluir seu login. Este código é válido por 10 minutos.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <h2 style="font-size:32px; letter-spacing:6px; color:#000000; background:#f5f5f5; border-radius:8px; padding:18px 0; margin:0; font-weight:bold;">
                  ${token}
                </h2>
              </td>
            </tr>
          </table>
          
          <!-- Redes Sociais -->
          <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
              <td align="center">
                <a href="${siteConfig.instagram.url}" style="margin:0 8px; display:inline-block;">
                  <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752879878/vid4hnfoaa6t4lea3yh1.png" alt="Instagram" style="width:24px; height:24px;" />
                </a>
                <a href="https://wa.me/${siteConfig.whatsapp.number}" style="margin:0 8px; display:inline-block;">
                  <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752879392/uvly6au1zsa12its3qmu.png" alt="WhatsApp" style="width:24px; height:24px;" />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
) => { 
  const resetLink = `${process.env.API_BASE_URL}/auth/new-password?token=${token}`

  await resend.emails.send({
    from: siteConfig.emailFrom,
    to: email,
    subject: "Reset your password",
    html: `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Redefina sua senha</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0; padding:0; background:#000000;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000; min-height:100vh; width:100%;">
      <tr>
        <td align="center" style="padding:32px 8px;">
          <!-- Logo fora do card -->
          <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752878414/ky6pwqqthd899jnmbem4.png" alt="Logo" style="max-width:200px; height:auto; display:block; margin:0 auto 24px auto;" />
          
          <table cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; max-width:420px; width:100%; box-shadow:0 2px 16px rgba(0,0,0,0.08); padding:32px 24px; font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <h1 style="font-size:22px; color:#333333; margin:0 0 8px 0; font-weight:bold;">Redefinição de Senha</h1>
              </td>
            </tr>
            <tr>
              <td style="color:#333333; font-size:16px; line-height:1.6; padding-bottom:24px; text-align:center;">
                Olá! Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Se você não solicitou isso, pode ignorar este e-mail.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${resetLink}" style="background:#000000; color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:16px; font-weight:bold; display:inline-block;">Redefinir Senha</a>
              </td>
            </tr>
            <tr>
              <td style="color:#333333; font-size:14px; text-align:center;">
                Se o botão não funcionar, copie e cole o seguinte link no seu navegador:<br/>
                <a href="${resetLink}" style="color:#000000; word-break:break-all;">${resetLink}</a>
              </td>
            </tr>
          </table>
          
          <!-- Redes Sociais -->
          <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
              <td align="center">
                <a href="${siteConfig.instagram.url}" style="margin:0 8px; display:inline-block;">
                  <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752879878/vid4hnfoaa6t4lea3yh1.png" alt="Instagram" style="width:24px; height:24px;" />
                </a>
                <a href="https://wa.me/${siteConfig.whatsapp.number}" style="margin:0 8px; display:inline-block;">
                  <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752879392/uvly6au1zsa12its3qmu.png" alt="WhatsApp" style="width:24px; height:24px;" />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  });
};

export const sendVerificationEmail = async (
  email: string,
   token: string
  ) => {
    const confirmLink = `${process.env.API_BASE_URL}/auth/new-verification?token=${token}`;
  await resend.emails.send({
    from: siteConfig.emailFrom,
    to: email,
    subject: "confirm your email",
    html:`<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Confirme seu e-mail</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0; padding:0; background:#000000;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000; min-height:100vh; width:100%;">
      <tr>
        <td align="center" style="padding:32px 8px;">
          <!-- Logo fora do card -->
          <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752878414/ky6pwqqthd899jnmbem4.png" alt="Logo" style="max-width:200px; height:auto; display:block; margin:0 auto 24px auto;" />
          
          <table cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; max-width:420px; width:100%; box-shadow:0 2px 16px rgba(0,0,0,0.08); padding:32px 24px; font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <h1 style="font-size:22px; color:#333333; margin:0 0 8px 0; font-weight:bold;">Verificação de E-mail</h1>
              </td>
            </tr>
            <tr>
              <td style="color:#333333; font-size:16px; line-height:1.6; padding-bottom:24px; text-align:center;">
                Olá! Obrigado por se registrar. Por favor, clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${confirmLink}" style="background:#000000; color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:16px; font-weight:bold; display:inline-block;">Confirmar E-mail</a>
              </td>
            </tr>
            <tr>
              <td style="color:#333333; font-size:14px; text-align:center;">
                Se o botão não funcionar, copie e cole o seguinte link no seu navegador:<br/>
                <a href="${confirmLink}" style="color:#000000; word-break:break-all;">${confirmLink}</a>
              </td>
            </tr>
          </table>
          
          <!-- Redes Sociais -->
          <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
              <td align="center">
                <a href="${siteConfig.instagram.url}" style="margin:0 8px; display:inline-block;">
                  <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752879878/vid4hnfoaa6t4lea3yh1.png" alt="Instagram" style="width:24px; height:24px;" />
                </a>
                <a href="https://wa.me/${siteConfig.whatsapp.number}" style="margin:0 8px; display:inline-block;">
                  <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752879392/uvly6au1zsa12its3qmu.png" alt="WhatsApp" style="width:24px; height:24px;" />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  })
  }

interface WeeklyScheduleData {
  id: string
  startDate: Date
  endDate: Date
  type: string
  title?: string | null
  description?: string | null
  tags: string[]
  buyer?: {
    fullName: string
    email?: string | null
    phone?: string | null
  } | null
  seller?: {
    name: string
    user: {
      name?: string | null
      email?: string | null
    }
  } | null
  product?: {
    name: string
    sku?: string | null
  } | null
  contract?: {
    id: string
    type: string
    totalAmount: number
    notes?: string | null
    deliveryDate: Date
    eventDate?: Date | null
  } | null
  order?: {
    id: string
    totalAmount?: number | null
    status?: string | null
  } | null
}

export const sendWeeklyScheduleReport = async (
  email: string,
  schedules: WeeklyScheduleData[]
) => {
  // Calcular início e fim da semana atual para o título
  const now = new Date()
  const currentDay = now.getDay()
  const startOfWeek = new Date(now)
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1
  startOfWeek.setDate(now.getDate() - daysToSubtract)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'PRODUCT_BLOCK': 'Bloqueio de Produto',
      'CLIENT_APPOINTMENT': 'Compromisso com Cliente'
    }
    return typeLabels[type] || type
  }

  const generateScheduleCard = (schedule: WeeklyScheduleData) => {
    const hasContract = schedule.contract
    const hasOrder = schedule.order
    const tags = schedule.tags.length > 0 ? schedule.tags.join(' • ') : 'Sem tags'

    return `
      <table cellpadding="0" cellspacing="0" style="width:100%; border:1px solid #ddd; margin-bottom:8px; font-family:Arial,sans-serif;">
        <tr>
          <td style="padding:10px;">
            <!-- Cabeçalho comprimido -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
              <tr>
                <td style="width:70%;">
                  <h3 style="font-size:14px; color:#000; margin:0; font-weight:bold;">
                    ${schedule.title || 'Agenda sem título'}
                  </h3>
                  <p style="font-size:10px; color:#666; margin:0;">
                    ${getTypeLabel(schedule.type)}
                  </p>
                </td>
                <td style="width:30%; text-align:right; vertical-align:top;">
                  <p style="font-size:10px; color:#666; margin:0;">
                    ${formatDateTime(schedule.startDate)} - ${formatDateTime(schedule.endDate)}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Informações principais em uma linha -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
              <tr>
                ${schedule.buyer ? `
                <td style="width:40%; vertical-align:top;">
                  <p style="font-size:10px; color:#666; margin:0 0 2px 0; font-weight:bold;">CLIENTE:</p>
                  <p style="font-size:11px; color:#000; margin:0;">${schedule.buyer.fullName}</p>
                  ${schedule.buyer.phone ? `<p style="font-size:9px; color:#666; margin:0;">${schedule.buyer.phone}</p>` : ''}
                </td>
                ` : '<td style="width:40%;"></td>'}
                
                ${schedule.seller ? `
                <td style="width:30%; vertical-align:top;">
                  <p style="font-size:10px; color:#666; margin:0 0 2px 0; font-weight:bold;">VENDEDOR:</p>
                  <p style="font-size:11px; color:#000; margin:0;">${schedule.seller.user.name}</p>
                </td>
                ` : '<td style="width:30%;"></td>'}

                <td style="width:30%; vertical-align:top;">
                  <p style="font-size:10px; color:#666; margin:0 0 2px 0; font-weight:bold;">TAGS:</p>
                  <p style="font-size:9px; color:#000; margin:0;">${tags}</p>
                </td>
              </tr>
            </table>

            ${schedule.product ? `
            <!-- Produto -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
              <tr>
                <td style="border-left:3px solid #f97316; padding-left:6px;">
                  <p style="font-size:10px; color:#666; margin:0 0 2px 0; font-weight:bold;">PRODUTO:</p>
                  <p style="font-size:11px; color:#000; margin:0;">${schedule.product.name}</p>
                  ${schedule.product.sku ? `<p style="font-size:9px; color:#666; margin:0;">SKU: ${schedule.product.sku}</p>` : ''}
                </td>
              </tr>
            </table>
            ` : ''}

            ${hasContract && schedule.contract ? `
            <!-- Contrato comprimido -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
              <tr>
                <td style="border-left:3px solid #16a34a; padding-left:6px;">
                  <p style="font-size:10px; color:#666; margin:0 0 2px 0; font-weight:bold;">CONTRATO:</p>
                  <p style="font-size:11px; color:#000; margin:0;">${schedule.contract.type} - ${formatCurrency(schedule.contract.totalAmount)}</p>
                  <p style="font-size:9px; color:#666; margin:0;">Entrega: ${formatDate(schedule.contract.deliveryDate)}</p>
                  ${schedule.contract.eventDate ? `<p style="font-size:9px; color:#666; margin:0;">Evento: ${formatDate(schedule.contract.eventDate)}</p>` : ''}
                  ${schedule.contract.notes ? `<p style="font-size:9px; color:#666; margin:0;">Obs: ${schedule.contract.notes}</p>` : ''}
                </td>
              </tr>
            </table>
            ` : ''}

            ${hasOrder && schedule.order ? `
            <!-- Pedido comprimido -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-left:3px solid #0284c7; padding-left:6px;">
                  <p style="font-size:10px; color:#666; margin:0 0 2px 0; font-weight:bold;">PEDIDO:</p>
                  <p style="font-size:11px; color:#000; margin:0;">
                    ${schedule.order.totalAmount ? formatCurrency(schedule.order.totalAmount) : 'Valor não informado'}
                    ${schedule.order.status ? ` - ${schedule.order.status}` : ''}
                  </p>
                </td>
              </tr>
            </table>
            ` : ''}

            ${schedule.description ? `
            <!-- Descrição comprimida -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
              <tr>
                <td style="padding:4px; background:#f9f9f9;">
                  <p style="font-size:9px; color:#666; margin:0 0 2px 0; font-weight:bold;">DESCRIÇÃO:</p>
                  <p style="font-size:10px; color:#000; margin:0; line-height:1.3;">
                    ${schedule.description}
                  </p>
                </td>
              </tr>
            </table>
            ` : ''}
          </td>
        </tr>
      </table>
    `
  }

  await resend.emails.send({
    from: siteConfig.emailFrom,
    to: email,
    subject: `Relatório Semanal de Agendamentos - ${formatDate(startOfWeek)} a ${formatDate(endOfWeek)}`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Relatório Semanal de Agendamentos</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          color-adjust: exact; 
          font-size: 10px !important;
        }
        .page-break { page-break-before: always; }
        h1, h2, h3 { page-break-after: avoid; }
        table { page-break-inside: avoid; }
      }
      body { margin: 0; padding: 15px; font-family: Arial, sans-serif; background: #fff; }
    </style>
  </head>
  <body>
    <!-- Cabeçalho comprimido -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:15px; border-bottom:2px solid #000;">
      <tr>
        <td style="padding-bottom:10px;">
          <h1 style="font-size:18px; color:#000; margin:0 0 5px 0; font-weight:bold; text-align:center;">
            RELATÓRIO SEMANAL - AGENDAMENTOS
          </h1>
          <p style="font-size:12px; color:#000; margin:0; text-align:center; font-weight:bold;">
            ${formatDate(startOfWeek)} a ${formatDate(endOfWeek)}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Resumo comprimido -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:15px; border:1px solid #000;">
      <tr>
        <td style="padding:8px; text-align:center; background:#f5f5f5;">
          <p style="font-size:14px; color:#000; margin:0; font-weight:bold;">
            TOTAL: ${schedules.length} ${schedules.length === 1 ? 'AGENDAMENTO' : 'AGENDAMENTOS'}
          </p>
          ${schedules.length === 0 ? `
          <p style="font-size:11px; color:#666; margin:5px 0 0 0;">
            Nenhum agendamento encontrado para esta semana.
          </p>
          ` : ''}
        </td>
      </tr>
    </table>
    
    <!-- Lista de Agendamentos -->
    ${schedules.length > 0 ? `
    <div>
      ${schedules.map(schedule => generateScheduleCard(schedule)).join('')}
    </div>
    ` : ''}
    
    <!-- Rodapé comprimido -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:15px; border-top:1px solid #000;">
      <tr>
        <td style="padding-top:8px; text-align:center;">
          <p style="font-size:9px; color:#666; margin:0;">
            Relatório gerado automaticamente em ${formatDateTime(new Date())}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`
  });
};

export const testimonialsEmail = async (
  email: string,
  productId: string,
) => {
  await resend.emails.send({
    from: siteConfig.emailFrom,
    to: email,
    subject: "Nos avalie",
    html:`<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Avalie sua compra</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0; padding:0; background:#000000;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000; min-height:100vh; width:100%;">
      <tr>
        <td align="center" style="padding:32px 8px;">
          <!-- Logo -->
          <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752878414/ky6pwqqthd899jnmbem4.png" alt="Logo" style="max-width:200px; height:auto; display:block; margin:0 auto 24px auto;" />
          
          <!-- Card -->
          <table cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; max-width:420px; width:100%; box-shadow:0 2px 16px rgba(0,0,0,0.08); padding:32px 24px; font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <h1 style="font-size:22px; color:#333333; margin:0 0 8px 0; font-weight:bold;">Nos avalie</h1>
              </td>
            </tr>
            <tr>
              <td style="color:#333333; font-size:16px; line-height:1.6; padding-bottom:24px; text-align:center;">
                Olá! Esperamos que tenha gostado do nosso trabalho. Gostaríamos muito de saber a sua opinião. Clique nas estrelas abaixo para nos contar como foi sua experiência!
              </td>
            </tr>
            <!-- Estrelas -->
            <tr>
              <td align="center" style="padding-bottom:8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    ${[1,2,3,4,5].map(star => `
                      <td align="center" style="padding:0 4px;">
                        <a href="${siteConfig.url}/testimonials/${productId}?stars=${star}" style="display:inline-block; line-height:0; text-decoration:none;">
                          <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1754784327/bkcnwfayypqqkcjnm8dx.png" alt="Avaliar com ${star} estrela${star > 1 ? 's' : ''}" style="width:36px; height:36px; display:block; border:0;" />
                        </a>
                      </td>`).join("")}
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Mensagem curta -->
            <tr>
              <td style="color:#666666; font-size:13px; text-align:center; padding-bottom:16px;">
                Leva menos de 5 segundos. Obrigado por nos ajudar a melhorar!
              </td>
            </tr>
            <!-- Agradecimento -->
            <tr>
              <td align="center" style="color:#111111; font-size:15px; font-weight:bold; padding-top:8px;">
                💖 Muito obrigado pelo seu apoio e confiança!
              </td>
            </tr>
          </table>
          
          <!-- Redes Sociais -->
          <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
              <td align="center">
                <a href="${siteConfig.instagram.url}" style="margin:0 8px; display:inline-block;">
                  <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752879878/vid4hnfoaa6t4lea3yh1.png" alt="Instagram" style="width:24px; height:24px; border:0; display:block;" />
                </a>
                <a href="https://wa.me/${siteConfig.whatsapp.number}" style="margin:0 8px; display:inline-block;">
                  <img src="https://res.cloudinary.com/dwjbrlatc/image/upload/v1752879392/uvly6au1zsa12its3qmu.png" alt="WhatsApp" style="width:24px; height:24px; border:0; display:block;" />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  })
}
