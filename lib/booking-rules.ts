import { addDays, startOfDay, subDays } from "date-fns";

// Regras de reserva compartilhadas entre a loja (navegador) e o servidor.
// O servidor sempre revalida com estas mesmas funções antes de criar o pedido ou cobrar.

// Dias que o vestido fica separado antes do evento (preparação), além do prazo de envio
export const RENTAL_PREP_DAYS = 3;
// Dias após o evento até o vestido voltar e ser higienizado
export const RENTAL_RETURN_DAYS = 3;
// Prazo usado enquanto o frete ainda não foi calculado
export const DEFAULT_SHIPPING_DAYS = 3;

export type ContractKind = "SALE" | "RENTAL";

export interface Booking {
  eventDate: Date | string;
  contractType: ContractKind;
}

export const toContractKind = (type?: string | null): ContractKind =>
  type === "SALE" || type === "ClothingSALE" ? "SALE" : "RENTAL";

interface Range {
  start: Date;
  // null = sem fim (venda: o vestido não volta)
  end: Date | null;
}

const occupiedRange = (eventDate: Date | string, kind: ContractKind, shippingDays: number): Range => {
  const day = startOfDay(new Date(eventDate));
  if (kind === "SALE") {
    return { start: subDays(day, shippingDays), end: null };
  }
  return {
    start: subDays(day, RENTAL_PREP_DAYS + shippingDays),
    end: addDays(day, RENTAL_RETURN_DAYS),
  };
};

const overlaps = (a: Range, b: Range) =>
  (a.end === null || b.start <= a.end) && (b.end === null || a.start <= b.end);

// Primeira data que pode ser escolhida: um dia para postar + prazo do frete
export const getMinimumEventDate = (shippingDays: number, today: Date = new Date()) =>
  addDays(startOfDay(today), shippingDays + 1);

export function isDateAvailable({
  date,
  contractType,
  bookings,
  shippingDays = DEFAULT_SHIPPING_DAYS,
  today = new Date(),
}: {
  date: Date;
  contractType: ContractKind;
  bookings: Booking[];
  shippingDays?: number;
  today?: Date;
}) {
  const day = startOfDay(date);
  if (day < getMinimumEventDate(shippingDays, today)) return false;

  const requested = occupiedRange(day, contractType, shippingDays);
  return !bookings.some((booking) =>
    overlaps(requested, occupiedRange(booking.eventDate, booking.contractType, shippingDays))
  );
}

// Período em que a cliente fica com o vestido alugado (mostrado na tela)
export const getRentalUsePeriod = (eventDate: Date) => ({
  from: subDays(startOfDay(eventDate), RENTAL_PREP_DAYS),
  to: addDays(startOfDay(eventDate), RENTAL_RETURN_DAYS),
});

export const isSameEventDay = (a?: Date | string | null, b?: Date | string | null) =>
  !!a && !!b && startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime();
