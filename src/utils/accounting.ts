import type { Split } from '@/types'
import { getCurrency } from '@/utils/currency'

/**
 * Validates that a set of splits satisfies the double-entry accounting equation:
 * The sum of all debits must equal the sum of all credits (total splits sum = 0).
 */
export function validateDoubleEntry(splits: Split[]): boolean {
  if (splits.length < 2) return false
  const sum = splits.reduce((acc, s) => acc + s.amount, 0)
  return Math.abs(sum) < 0.005 // floating point tolerance
}

/**
 * Format a number as currency with the given code (default: BRL)
 */
export function formatCurrency(value: number, currencyCode?: string): string {
  const code = currencyCode ?? 'BRL'
  const info = getCurrency(code)
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: code,
  }).format(value)
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string, locale: string = 'pt-BR'): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function today(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Get month name in Portuguese
 */
export function getMonthName(month: number, months: string[]): string {
  return months[month]
}
