import { ContractKind } from "@/lib/booking-rules";

// Termos exibidos na página do produto, conforme o tipo escolhido (compra ou aluguel)
export function PurchaseTerms({ contractType }: { contractType: ContractKind }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {contractType === "SALE" ? (
        <section className="space-y-2">
          <h4 className="font-semibold">Ajustes e confecção</h4>
          <p>• Para produtos &quot;Sob Medida&quot;, você é responsável por fornecer suas medidas exatas conforme o guia disponível.</p>
          <p>• Para produtos de &quot;Tamanho Padrão&quot;, consulte nossa tabela de medidas para escolher o tamanho adequado.</p>
          <h4 className="pt-2 font-semibold">Direito de arrependimento</h4>
          <p>• Você tem 7 dias corridos após o recebimento para desistir da compra e solicitar devolução.</p>
          <p>• <strong>Exceção:</strong> produtos &quot;Sob Medida&quot; ou personalizados não permitem arrependimento por serem únicos.</p>
          <p>• Para exercer o direito, o produto deve ser devolvido na embalagem original, sem uso, com todos os acessórios.</p>
        </section>
      ) : (
        <section className="space-y-2">
          <h4 className="font-semibold">Processo de locação</h4>
          <p>• A locação é para produtos de &quot;Tamanho Padrão&quot; apenas. Não realizamos ajustes à distância.</p>
          <p>• A reserva só é confirmada após aprovação do pagamento.</p>
          <h4 className="pt-2 font-semibold">Entrega e devolução</h4>
          <p>• O traje chegará com antecedência segura em relação ao evento.</p>
          <p>• Você receberá embalagem e etiqueta pré-paga para devolução.</p>
          <p>• <strong>Obrigatório:</strong> postar o traje no primeiro dia útil após o evento.</p>
          <h4 className="pt-2 font-semibold text-destructive">Multas e responsabilidades</h4>
          <p>• <strong>Atraso na devolução:</strong> multa diária de 20% sobre o valor da locação.</p>
          <p>• <strong>Danos ou sujeira excessiva:</strong> taxa mínima de R$ 200,00 para reparo/limpeza.</p>
          <p>• <strong>Extravio ou dano irreparável:</strong> pagamento do valor integral de venda do produto.</p>
        </section>
      )}

      <section className="space-y-2">
        <h4 className="font-semibold">Entrega e frete</h4>
        <p>• Prazos são estimativas das transportadoras a partir da confirmação do pagamento.</p>
        <p>• Você é responsável por fornecer endereço correto e completo.</p>
      </section>

      <p className="text-xs text-muted-foreground">
        Todo o conteúdo, incluindo imagens, textos e design dos produtos, é de propriedade da My Dress Floripa.
      </p>
    </div>
  );
}
