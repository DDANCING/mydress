// utils/decimalToNumber.ts
export function decimalToNumber<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map(decimalToNumber) as unknown as T;
  }

  if (input !== null && typeof input === 'object') {
    const output: any = {};

    for (const key in input) {
      const value = (input as any)[key];

      // Prisma Decimal tem toNumber()
      if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
        output[key] = value.toNumber();
      } else {
        output[key] = decimalToNumber(value);
      }
    }

    return output;
  }

  return input;
}
