import { format, formatRelative, differenceInDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

// Timezone padrão para São Paulo
const SAO_PAULO_TZ = "America/Sao_Paulo";

/**
 * Função principal para formatar datas vindas do banco
 * Mantém o formato original "hoje às XX:XX" mas com timezone correto
 */
export function formatDateForDisplay(date: string | Date): string {
  try {
    // Converte a data UTC para horário de São Paulo
    const dateUTC = new Date(date);
    const dateSP = toZonedTime(dateUTC, SAO_PAULO_TZ);
    
    // Compara com o momento atual em SP
    const nowSP = toZonedTime(new Date(), SAO_PAULO_TZ);
    const daysDiff = differenceInDays(nowSP, dateSP);

    if (daysDiff > 30) {
      // Para datas antigas, mostra apenas a data
      return formatInTimeZone(dateUTC, SAO_PAULO_TZ, "dd/MM/yyyy", { locale: ptBR });
    } else {
      // Para datas recentes, usa formatRelative com dates corretas
      return formatRelative(dateSP, nowSP, { locale: ptBR });
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return "Data inválida";
  }
}

/**
 * Formata data com formato específico sempre em horário de SP
 */
export function formatDateSP(date: string | Date, formatStr: string = "dd/MM/yyyy HH:mm"): string {
  try {
    const dateUTC = new Date(date);
    return formatInTimeZone(dateUTC, SAO_PAULO_TZ, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data SP:', error);
    return "Data inválida";
  }
}

/**
 * Versão simplificada que sempre mostra data e hora em SP no formato fixo
 */
export function simpleDateSP(date: string | Date): string {
  try {
    const dateUTC = new Date(date);
    return formatInTimeZone(dateUTC, SAO_PAULO_TZ, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch (error) {
    console.error('Erro na conversão de data:', error);
    return "Erro na data";
  }
}
