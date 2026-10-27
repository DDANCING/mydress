import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function PoliticasPage() {
  return (
    <div className="w-screen flex flex-col flex-wrap items-center justify-center gap-4 my-20">
      <div className="w-[90%] max-w-4xl">
        <div className="w-full mb-10">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Início</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Políticas da Loja</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="max-w-none">
          <h1 className="text-3xl font-bold text-center mb-8">
            Termos e Condições Gerais de Uso, Venda e Locação
          </h1>
          <h2 className="text-xl font-semibold text-center mb-8 text-muted-foreground">
            My Dress Floripa
          </h2>

          <div className="bg-muted/30 p-6 rounded-lg mb-8">
            <p className="text-lg">
              Bem-vindo(a) à My Dress Floripa! Ao utilizar nosso site para comprar ou alugar nossos produtos, você concorda com os seguintes termos e condições.
            </p>
          </div>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Primeira - Do Objeto</h3>
            <p className="mb-4">
              <strong>1.1.</strong> Este documento regula a Venda e/ou a Locação (Aluguel) de trajes e produtos de vestuário da My Dress Floripa, realizadas através do nosso site para clientes no Brasil e no exterior.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Segunda - Da Propriedade Intelectual</h3>
            <p className="mb-4">
              <strong>2.1.</strong> Todo o conteúdo do site, incluindo imagens, textos e design dos produtos, é de propriedade da My Dress Floripa.
            </p>
          </section>

          <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-4">
              Seção I - Termos Específicos para VENDA
            </h2>
          </div>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Terceira - Dos Ajustes e Confecção</h3>
            <div className="space-y-4">
              <p>
                <strong>3.1.</strong> Para produtos &ldquo;Sob Medida&rdquo;, a CLIENTE é responsável por fornecer suas medidas exatas, de acordo com o guia de medição disponível em nosso site.
              </p>
              <p>
                <strong>3.2.</strong> O ateliê confeccionará a peça com base estritamente nas medidas informadas. Quaisquer ajustes necessários após o recebimento do produto, decorrentes de medição incorreta por parte da CLIENTE, serão de sua inteira responsabilidade e custo.
              </p>
              <p>
                <strong>3.3.</strong> Para produtos de &ldquo;Tamanho Padrão&rdquo; (P, M, G, etc.), a CLIENTE deve consultar nossa tabela de medidas para escolher o tamanho adequado. A responsabilidade pela escolha correta do tamanho é da CLIENTE.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Quarta - Da Desistência e Devolução (Direito de Arrependimento)</h3>
            <div className="space-y-4">
              <p>
                <strong>4.1.</strong> Conforme o Art. 49 do Código de Defesa do Consumidor, para compras online, a CLIENTE tem o prazo de 7 (sete) dias corridos, a contar da data de recebimento do produto, para desistir da compra e solicitar a devolução do valor pago.
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p>
                  <strong>4.2. EXCEÇÃO PARA PRODUTOS PERSONALIZADOS:</strong> O direito de arrependimento não se aplica a produtos confeccionados &ldquo;Sob Medida&rdquo; ou que tenham sofrido qualquer tipo de personalização a pedido da cliente (como adição de bordados, alteração de tecidos, etc.), por se tratarem de bens feitos especificamente para a consumidora, impossibilitando a revenda. Nestes casos, a venda é final.
                </p>
              </div>
              <p>
                <strong>4.3.</strong> Para exercer o direito de arrependimento (aplicável a produtos não personalizados), a CLIENTE deverá notificar o ateliê por e-mail, e o produto deverá ser devolvido na embalagem original, sem indícios de uso, sem violação do lacre ou etiqueta, acompanhado de todos os seus acessórios. O custo do frete de devolução será de responsabilidade da CLIENTE.
              </p>
            </div>
          </section>

          <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
              Seção II - Termos Específicos para LOCAÇÃO (Aluguel)
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                <strong>Aviso sobre a complexidade da locação a distância:</strong> A locação para outras cidades/estados é uma operação logística complexa. Recomendamos iniciar com vendas e, caso opte pela locação, seguir as cláusulas abaixo com rigor. A locação internacional não é recomendada inicialmente.
              </p>
            </div>
          </div>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Quinta - Do Processo de Locação</h3>
            <div className="space-y-4">
              <p>
                <strong>5.1.</strong> A locação será realizada para produtos de &ldquo;Tamanho Padrão&rdquo;. Não realizamos ajustes à distância para peças alugadas. A CLIENTE deve escolher o tamanho com base na tabela de medidas.
              </p>
              <p>
                <strong>5.2.</strong> A reserva só é confirmada após a aprovação do pagamento. A CLIENTE deve informar a data do evento no ato da reserva.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Sexta - Da Entrega e Devolução do Traje Alugado</h3>
            <div className="space-y-4">
              <p>
                <strong>6.1.</strong> O envio do traje será programado para que ele chegue ao endereço da CLIENTE com antecedência segura em relação à data do evento.
              </p>
              <p>
                <strong>6.2.</strong> Junto com o traje, a CLIENTE receberá uma embalagem e uma etiqueta de postagem pré-paga para a devolução.
              </p>
              <p>
                <strong>6.3.</strong> A CLIENTE se compromete a postar o traje na transportadora indicada no primeiro dia útil seguinte à data do evento. O comprovante de postagem deve ser enviado ao nosso e-mail.
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p>
                  <strong>6.4. MULTA POR ATRASO NA DEVOLUÇÃO:</strong> O atraso na devolução implicará em multa diária de 20% (vinte por cento) sobre o valor total da locação, pois impede o uso do traje por outras clientes.
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                <p>
                  <strong>6.5. DANOS E SUJEIRA EXCESSIVA:</strong> Caso o traje seja devolvido com danos (rasgos, queimaduras, manchas permanentes) ou sujeira excessiva que exija limpeza especializada, será cobrada uma taxa de reparo ou limpeza, com valor mínimo de R$ 200,00, a ser avaliada pelo ateliê. Se o dano for irreparável, aplica-se a cláusula 6.6.
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p>
                  <strong>6.6. EXTRAVIO, ROUBO OU DANO IRREPARÁVEL:</strong> A não devolução do traje ou sua devolução com dano irreparável obrigará a CLIENTE a pagar o valor de venda integral do produto, que será descontado do valor já pago pela locação.
                </p>
              </div>
            </div>
          </section>

          <div className="bg-gray-50 dark:bg-gray-950/20 border-l-4 border-gray-500 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Seção III - Termos Gerais (Aplicáveis a Vendas e Locações)
            </h2>
          </div>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Sétima - Do Pagamento</h3>
            <div className="space-y-4">
              <p>
                <strong>7.1.</strong> O valor do produto/serviço será aquele informado no site no momento da compra/reserva.
              </p>
              <p>
                <strong>7.2.</strong> O valor do frete será calculado e adicionado ao final do pedido.
              </p>
              <p>
                <strong>7.3.</strong> Os pagamentos podem ser realizados por Cartão de Crédito, Pix ou outro meio disponibilizado pela plataforma de pagamento do site. A confirmação do pedido está sujeita à aprovação da transação.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Oitava - Da Entrega e Frete</h3>
            <div className="space-y-4">
              <p>
                <strong>8.1.</strong> O prazo de entrega informado no site é uma estimativa fornecida pela transportadora (Correios, etc.) e começa a contar a partir da confirmação do pagamento (para produtos a pronta entrega) ou do fim do prazo de confecção (para produtos sob encomenda).
              </p>
              <p>
                <strong>8.2.</strong> O ateliê não se responsabiliza por atrasos na entrega causados por greves, desastres naturais ou outros fatores de responsabilidade da transportadora.
              </p>
              <p>
                <strong>8.3.</strong> A CLIENTE é responsável por fornecer o endereço de entrega correto e completo. Caso a encomenda retorne por erro no endereço ou ausência do destinatário, o custo do reenvio será de responsabilidade da CLIENTE.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p>
                  <strong>8.4. PARA ENVIOS INTERNACIONAIS:</strong> A CLIENTE está ciente de que todas as taxas de importação, impostos alfandegários e/ou outros encargos de desembaraço aduaneiro do país de destino são de sua inteira e exclusiva responsabilidade. O My Dress Floripa não tem controle sobre esses valores e não se responsabiliza por eles.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Cláusula Nona - Do Foro</h3>
            <p>
              <strong>9.1.</strong> Para dirimir quaisquer controvérsias oriundas deste contrato, fica eleito o Foro da Comarca de Florianópolis, Estado de Santa Catarina, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <div className="bg-muted/30 p-6 rounded-lg mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Para dúvidas ou esclarecimentos sobre estes termos, entre em contato conosco através do nosso atendimento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
