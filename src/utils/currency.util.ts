export function parseCurrency(raw: string): number {
  const value = Number.parseFloat(raw.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(value)) {
    throw new Error(`Cannot parse currency from "${raw}"`);
  }
  return value;
}

export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function pricesEqual(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}

export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
