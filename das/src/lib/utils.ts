
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

export function parseCurrencyToNumber(value: string | number): number {
  if (typeof value === 'number') return value
  if (!value) return 0
  return Number(value.replace(/[^0-9.-]+/g, ''))
}