import { siteConfig, formatAddress } from "@/lib/site-config";

// Data fixa: mude sempre que o texto da política mudar
const LAST_UPDATED = "1 de novembro de 2026";

export function PrivacyPolicy() {
  const contact = siteConfig.email
    ? `pelo e-mail ${siteConfig.email} ou pelo WhatsApp ${siteConfig.whatsapp.display}`
    : `pelo WhatsApp ${siteConfig.whatsapp.display}`;

  return (
    <section id="privacidade" className="mb-16 scroll-mt-24">
      <h2 className="text-3xl font-bold text-center mb-2">Política de Privacidade</h2>
      <p className="text-center text-sm text-muted-foreground mb-8">Última atualização: {LAST_UPDATED}</p>

      <div className="space-y-8">
        <div className="bg-muted/30 p-6 rounded-lg">
          <p>
            Esta Política de Privacidade explica quais dados pessoais a {siteConfig.legalName} (&ldquo;My Dress Floripa&rdquo;),
            CNPJ {siteConfig.cnpj}, com endereço em {formatAddress()}, coleta quando você usa o site{" "}
            {siteConfig.url}, como usamos, com quem compartilhamos e quais são os seus direitos, de acordo com a Lei
            Geral de Proteção de Dados (Lei nº 13.709/2018 &ndash; LGPD). A My Dress Floripa é a controladora dos seus dados.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">1. Dados que coletamos</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Dados de cadastro e login:</strong> nome, e-mail, senha (guardada apenas de forma criptografada) e
              foto de perfil.
            </li>
            <li>
              <strong>Dados recebidos do Google (Login com Google):</strong> quando você escolhe entrar com sua conta
              Google, recebemos somente seu nome, endereço de e-mail e foto de perfil, conforme as permissões
              &ldquo;openid&rdquo;, &ldquo;email&rdquo; e &ldquo;profile&rdquo;. Não temos acesso à sua senha do Google,
              contatos, Gmail, Drive, agenda ou qualquer outro dado da sua conta. O mesmo vale para o login com GitHub.
            </li>
            <li>
              <strong>Dados de compra e locação:</strong> nome completo, CPF ou CNPJ, telefone, endereço de entrega,
              data do evento, medidas e tamanho (quando informados), itens pedidos e histórico de pedidos e contratos.
            </li>
            <li>
              <strong>Dados de pagamento:</strong> os pagamentos com cartão são processados pela Stripe. Não
              armazenamos o número completo do cartão nem o código de segurança; recebemos apenas a confirmação e o
              status do pagamento.
            </li>
            <li>
              <strong>Dados que você nos envia:</strong> mensagens de contato, depoimentos, fotos enviadas, itens
              favoritados e e-mail cadastrado na newsletter.
            </li>
            <li>
              <strong>Dados de navegação:</strong> páginas visitadas, tipo de dispositivo e navegador, endereço IP e
              informações de cookies, coletados para segurança, estatísticas de acesso e medição de campanhas.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">2. Como usamos seus dados</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Criar e manter sua conta e permitir que você entre no site (inclusive pelo Login com Google).</li>
            <li>Processar compras, reservas e locações, confirmar pagamentos e organizar entregas e devoluções.</li>
            <li>Emitir notas fiscais e cumprir obrigações legais, fiscais e contábeis.</li>
            <li>Enviar e-mails sobre sua conta e seus pedidos (confirmação, verificação de e-mail, recuperação de senha, código de dois fatores).</li>
            <li>Enviar novidades e promoções, somente se você se inscreveu na newsletter. Você pode cancelar a qualquer momento.</li>
            <li>Atender você pelo WhatsApp, e-mail ou na loja.</li>
            <li>Prevenir fraudes e abusos, proteger a segurança do site e limitar tentativas excessivas de acesso.</li>
            <li>Entender como o site é usado e melhorar nossos produtos, serviços e anúncios.</li>
          </ul>
          <p className="mt-4">
            As bases legais da LGPD que usamos são: execução de contrato (art. 7º, V), cumprimento de obrigação legal
            (art. 7º, II), legítimo interesse (art. 7º, IX) e consentimento (art. 7º, I), como no caso da newsletter.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 p-6">
          <h3 className="text-xl font-bold mb-4">3. Uso dos dados do Google</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Usamos o nome, o e-mail e a foto de perfil recebidos do Google <strong>somente</strong> para identificar
              você, criar e acessar sua conta na My Dress Floripa e exibir seu nome e foto na sua área de cliente.
            </li>
            <li>Não vendemos, alugamos nem compartilhamos dados recebidos do Google com terceiros para publicidade.</li>
            <li>Não usamos dados do Google para anúncios personalizados nem para treinar modelos de inteligência artificial.</li>
            <li>
              Os dados ficam guardados no nosso banco de dados enquanto sua conta existir. Você pode pedir a exclusão a
              qualquer momento (veja o item 7) e também pode remover o acesso do nosso site em{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                myaccount.google.com/permissions
              </a>
              .
            </li>
            <li>
              O uso e a transferência de informações recebidas das APIs do Google seguem a{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Política de Dados do Usuário dos Serviços de API do Google
              </a>
              , incluindo os requisitos de Uso Limitado.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">4. Com quem compartilhamos</h3>
          <p className="mb-4">
            Não vendemos seus dados. Compartilhamos apenas o necessário com empresas que nos ajudam a operar a loja:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stripe:</strong> processamento de pagamentos.</li>
            <li><strong>Melhor Envio e transportadoras (como os Correios):</strong> cálculo de frete, envio e devolução.</li>
            <li><strong>Resend:</strong> envio de e-mails da conta, dos pedidos e da newsletter.</li>
            <li><strong>Vercel:</strong> hospedagem do site e estatísticas de acesso anônimas.</li>
            <li><strong>Cloudinary e UploadThing:</strong> armazenamento de imagens.</li>
            <li><strong>Google (Analytics e Ads):</strong> estatísticas de navegação e medição de campanhas, por meio de cookies.</li>
            <li><strong>Secretaria da Fazenda (SEFAZ):</strong> emissão de notas fiscais eletrônicas, como exige a lei.</li>
            <li><strong>Autoridades públicas:</strong> quando houver obrigação legal ou ordem judicial.</li>
          </ul>
          <p className="mt-4">
            Alguns desses fornecedores podem armazenar dados fora do Brasil. Nesses casos, exigimos que eles adotem
            proteção adequada, conforme a LGPD.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">5. Cookies</h3>
          <p>
            Usamos cookies essenciais para manter você conectado e guardar o carrinho, e cookies de estatística e
            publicidade (Google Analytics, Google Ads e Vercel Analytics) para entender o uso do site. Você pode bloquear
            ou apagar cookies nas configurações do seu navegador; sem os cookies essenciais, o login e o carrinho podem
            não funcionar.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">6. Por quanto tempo guardamos</h3>
          <p>
            Guardamos os dados da conta enquanto ela estiver ativa. Dados de pedidos, contratos e notas fiscais são
            mantidos pelo prazo exigido pela legislação fiscal (em geral, 5 anos). Depois disso, os dados são excluídos
            ou anonimizados.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">7. Seus direitos</h3>
          <p className="mb-4">Pela LGPD, você pode a qualquer momento:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>confirmar se tratamos seus dados e ter acesso a eles;</li>
            <li>corrigir dados incompletos, errados ou desatualizados;</li>
            <li>pedir a exclusão da sua conta e dos seus dados (exceto os que a lei nos obriga a guardar);</li>
            <li>pedir a portabilidade dos seus dados;</li>
            <li>revogar o consentimento, como cancelar a newsletter;</li>
            <li>saber com quem compartilhamos seus dados;</li>
            <li>reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
          </ul>
          <p className="mt-4">
            Para exercer qualquer direito, fale conosco {contact}. Respondemos em até 15 dias.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">8. Segurança</h3>
          <p>
            Usamos conexão criptografada (HTTPS), senhas guardadas com criptografia, verificação de e-mail, autenticação
            em dois fatores opcional, limite de tentativas de acesso e acesso restrito aos dados apenas para a equipe
            que precisa deles.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">9. Menores de idade</h3>
          <p>
            O site não é destinado a menores de 18 anos. Compras e locações de menores devem ser feitas pelo responsável legal.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">10. Alterações e contato</h3>
          <p>
            Podemos atualizar esta política. A data da última atualização fica sempre no topo desta seção. Dúvidas sobre
            privacidade: {contact}, ou no endereço {formatAddress()}.
          </p>
        </div>
      </div>
    </section>
  );
}
