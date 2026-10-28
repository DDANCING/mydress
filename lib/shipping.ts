import { siteConfig } from "@/lib/site-config";

// Cálculo de frete usado pela loja. Roda só no servidor.
// Com MELHOR_ENVIO_TOKEN definido, as cotações vêm do Melhor Envio (Correios, Jadlog etc).
// Sem token, usa a estimativa por distância que a loja já tinha, para o site nunca ficar sem frete.

export interface ShippingQuote {
  id: string;
  name: string;
  price: number;
  delivery_time: number;
}

const onlyDigits = (value: string) => value.replace(/\D/g, "");

// CEP de onde os vestidos são postados (SHIPPING_ORIGIN_CEP no .env; padrão: endereço da loja)
export const getOriginCep = () => onlyDigits(process.env.SHIPPING_ORIGIN_CEP || siteConfig.address.zip);

// Embalagem de um vestido. Vários vestidos vão empilhados na mesma caixa.
const PACKAGE = { width: 30, length: 40, heightPerItem: 8, weightPerItemKg: 0.8, maxHeight: 100 };

const packageFor = (quantity: number) => ({
  width: PACKAGE.width,
  length: PACKAGE.length,
  height: Math.min(PACKAGE.heightPerItem * quantity, PACKAGE.maxHeight),
  weight: Number((PACKAGE.weightPerItemKg * quantity).toFixed(2)),
});

interface MelhorEnvioService {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
  company?: { name?: string };
}

async function quoteMelhorEnvio(
  token: string,
  destinationCep: string,
  quantity: number,
  insuranceValue: number
): Promise<ShippingQuote[]> {
  const baseUrl =
    process.env.MELHOR_ENVIO_SANDBOX === "true"
      ? "https://sandbox.melhorenvio.com.br"
      : "https://melhorenvio.com.br";

  const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      // O Melhor Envio exige identificação do app com um e-mail de contato
      "User-Agent": `${siteConfig.fullName} (${process.env.MELHOR_ENVIO_CONTACT_EMAIL || siteConfig.email || "contato"})`,
    },
    body: JSON.stringify({
      from: { postal_code: getOriginCep() },
      to: { postal_code: destinationCep },
      package: packageFor(quantity),
      options: { insurance_value: insuranceValue, receipt: false, own_hand: false },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Melhor Envio respondeu ${response.status}: ${await response.text()}`);
  }

  const services = (await response.json()) as MelhorEnvioService[];

  return services
    .filter((service) => !service.error && (service.custom_price || service.price))
    .map((service) => ({
      id: `me-${service.id}`,
      name: [service.company?.name, service.name].filter(Boolean).join(" "),
      price: Number(Number(service.custom_price ?? service.price).toFixed(2)),
      delivery_time: service.custom_delivery_time ?? service.delivery_time ?? 0,
    }))
    .sort((a, b) => a.price - b.price);
}

// ---- Estimativa sem token (lógica anterior, agora com a origem correta) ----

const DISTANCIA_BASE = 506.2;
const PAC_BASE = 20;
const SEDEX_BASE = 25;
const CUSTO_EXTRA_POR_ITEM = 0.2;

async function getCoordsFromCep(cep: string) {
  const viaCep = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: "force-cache" });
  const address = await viaCep.json();
  if (address.erro) throw new Error(`CEP inválido: ${cep}`);

  const geo = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      `${address.localidade},${address.uf},Brasil`
    )}`,
    { headers: { "User-Agent": "MyDressFloripa/1.0 (Frete Calculator)" }, cache: "force-cache" }
  );
  const [place] = await geo.json();
  if (!place) throw new Error(`Coordenadas não encontradas para: ${address.localidade}-${address.uf}`);

  return { lat: parseFloat(place.lat), lon: parseFloat(place.lon) };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function prazoPorDistancia(distanciaKm: number) {
  if (distanciaKm <= 100) return 2;
  if (distanciaKm >= 2000) return 20;
  return Math.round(2 + ((distanciaKm - 100) / 1900) * 18);
}

async function estimateShipping(destinationCep: string, quantity: number): Promise<ShippingQuote[]> {
  const [origem, destino] = await Promise.all([getCoordsFromCep(getOriginCep()), getCoordsFromCep(destinationCep)]);
  const distanciaKm = haversine(origem.lat, origem.lon, destino.lat, destino.lon);
  const fator = distanciaKm / DISTANCIA_BASE;
  const extra = quantity > 1 ? (quantity - 1) * CUSTO_EXTRA_POR_ITEM : 0;
  const prazo = prazoPorDistancia(distanciaKm);

  return [
    {
      id: "04510",
      name: "PAC",
      price: Number(Math.max(PAC_BASE, PAC_BASE * fator + extra).toFixed(2)),
      delivery_time: prazo + 2,
    },
    {
      id: "04014",
      name: "SEDEX",
      price: Number(Math.max(SEDEX_BASE, SEDEX_BASE * fator + extra).toFixed(2)),
      delivery_time: prazo,
    },
  ];
}

export async function quoteShipping({
  cep,
  quantity,
  insuranceValue = 0,
}: {
  cep: string;
  quantity: number;
  insuranceValue?: number;
}): Promise<ShippingQuote[]> {
  const destinationCep = onlyDigits(cep);
  if (destinationCep.length !== 8) throw new Error("CEP inválido");
  const items = Math.max(1, Math.floor(quantity));

  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (token) {
    try {
      const quotes = await quoteMelhorEnvio(token, destinationCep, items, insuranceValue);
      if (quotes.length > 0) return quotes;
    } catch (error) {
      console.error("[SHIPPING] Falha no Melhor Envio, usando estimativa:", error);
    }
  }

  return estimateShipping(destinationCep, items);
}
