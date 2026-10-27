"use server";

import axios from "axios";

// Base para 506.2km (usada para ajustar o preço proporcionalmente)
const DISTANCIA_BASE = 506.2;

// Valores base para o preço (1 unidade) - Brasil
const PAC_BASE = 20; // R$
const SEDEX_BASE = 25; // R$

const CUSTO_EXTRA_POR_ITEM = 0.2;

// Preço e prazo fixos para frete internacional
const INTERNACIONAL_BASE_PRICE = 150; // R$, por exemplo
const INTERNACIONAL_DIAS_MIN = 5;
const INTERNACIONAL_DIAS_MAX = 30;

// Função para buscar coordenadas a partir do CEP brasileiro (ViaCEP + Nominatim)
async function getCoordsFromCepBrasil(cep: string) {
  const viaCep = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
  if (viaCep.data.erro) throw new Error(`CEP inválido: ${cep}`);

  const cidade = viaCep.data.localidade;
  const uf = viaCep.data.uf;

  const geoResponse = await axios.get(
    `https://nominatim.openstreetmap.org/search?format=json&q=${cidade},${uf},Brasil`,
    {
      headers: {
        "User-Agent": "MyDressFloripa/1.0 (Frete Calculator)",
      },
    }
  );

  const geo = geoResponse.data[0];
  if (!geo) throw new Error(`Coordenadas não encontradas para: ${cidade}-${uf}`);

  return {
    lat: parseFloat(geo.lat),
    lon: parseFloat(geo.lon),
  };
}

// Função para buscar coordenadas diretamente pelo ZIP code internacional no Nominatim
async function getCoordsFromZipInternational(zip: string, country: string) {
  const query = encodeURIComponent(`${zip}, ${country}`);
  const geoResponse = await axios.get(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
    {
      headers: {
        "User-Agent": "MyDressFloripa/1.0 (Frete Calculator)",
      },
    }
  );

  const geo = geoResponse.data[0];
  if (!geo) throw new Error(`Coordenadas não encontradas para: ${zip}, ${country}`);

  return {
    lat: parseFloat(geo.lat),
    lon: parseFloat(geo.lon),
  };
}

// Fórmula Haversine para cálculo da distância em km entre dois pontos geográficos
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Raio da Terra em km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Função para calcular prazo entre diasMin e diasMax baseado na distância e faixa informada
function calcularPrazoGenerico(distanciaKm: number, diasMin: number, diasMax: number, distanciaMin: number, distanciaMax: number) {
  if (distanciaKm <= distanciaMin) return diasMin;
  if (distanciaKm >= distanciaMax) return diasMax;

  const proporcao = (distanciaKm - distanciaMin) / (distanciaMax - distanciaMin);
  return Math.round(diasMin + proporcao * (diasMax - diasMin));
}

export interface FreteData {
  sCepOrigem: string;
  sCepDestino: string;
  quantidade: number;
  paisDestino?: string;
}

export interface FreteResult {
  id: string;
  name: string;
  price: number;
  delivery_time: number;
}

export async function calcularFrete(data: FreteData): Promise<FreteResult[]> {
  try {
    const { sCepOrigem, sCepDestino, quantidade, paisDestino } = data;

    if (!sCepOrigem || !sCepDestino || !quantidade) {
      throw new Error("Campos obrigatórios: sCepOrigem, sCepDestino, quantidade");
    }

    // Detectar se é CEP brasileiro: 8 dígitos numéricos
    const isCepBrasil = /^[0-9]{8}$/.test(sCepOrigem) && /^[0-9]{8}$/.test(sCepDestino);

    let origem, destino;

    if (isCepBrasil) {
      // Brasil - busca com ViaCEP + Nominatim
      origem = await getCoordsFromCepBrasil(sCepOrigem);
      destino = await getCoordsFromCepBrasil(sCepDestino);
    } else {
      // Internacional - busca direto no Nominatim
      if (!paisDestino) {
        throw new Error("Para envio internacional informe o campo 'paisDestino'");
      }
      origem = await getCoordsFromZipInternational(sCepOrigem, "Brasil"); // Origem Brasil
      destino = await getCoordsFromZipInternational(sCepDestino, paisDestino);
    }

    // Calcula distância entre pontos
    const distanciaKm = haversine(origem.lat, origem.lon, destino.lat, destino.lon);

    // Custo extra por quantidade maior que 1
    const extraPorItem = quantidade > 1 ? (quantidade - 1) * CUSTO_EXTRA_POR_ITEM : 0;

    if (isCepBrasil) {
      // Brasil: cálculo tradicional PAC e SEDEX

      // Fator proporcional para preço com base na distância
      const fatorDistancia = distanciaKm / DISTANCIA_BASE;

      // Calcula prazo base (2-20 dias)
      const prazoBase = calcularPrazoGenerico(distanciaKm, 2, 20, 100, 2000);

      const fretes = [
        {
          id: "04510",
          name: "PAC",
          price: parseFloat(
            Math.max(PAC_BASE, PAC_BASE * fatorDistancia + extraPorItem).toFixed(2)
          ),
          delivery_time: prazoBase + 2, // PAC mais lento
        },
        {
          id: "04014",
          name: "SEDEX",
          price: parseFloat(
            Math.max(SEDEX_BASE, SEDEX_BASE * fatorDistancia + extraPorItem).toFixed(2)
          ),
          delivery_time: prazoBase,
        },
      ];

      return fretes;
    } else {
      // Internacional: retorna uma única opção de frete "Correios Internacional"

      // Prazo entre 5 e 30 dias baseado na distância
      const prazoBaseInt = calcularPrazoGenerico(distanciaKm, INTERNACIONAL_DIAS_MIN, INTERNACIONAL_DIAS_MAX, 500, 15000);

      // Preço fixo + extra por item
      const precoInt = INTERNACIONAL_BASE_PRICE + extraPorItem;

      const freteIntl = [
        {
          id: "CORREIOS_INT",
          name: "Correios Internacional",
          price: parseFloat(precoInt.toFixed(2)),
          delivery_time: prazoBaseInt,
        },
      ];

      return freteIntl;
    }
  } catch (error: any) {
    console.error("Erro ao calcular frete:", error);
    throw new Error(error.message || error);
  }
}
