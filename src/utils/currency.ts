import { ref, type Ref } from 'vue'

export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  locale: string
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro', locale: 'pt-BR' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Iene Japonês', locale: 'ja-JP' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco Suíço', locale: 'de-CH' },
  { code: 'CAD', symbol: 'C$', name: 'Dólar Canadense', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar Australiano', locale: 'en-AU' },
  { code: 'ARS', symbol: 'ARS', name: 'Peso Argentino', locale: 'es-AR' },
  { code: 'CNY', symbol: '¥', name: 'Yuan Chinês', locale: 'zh-CN' },
  { code: 'KRW', symbol: '₩', name: 'Won Sul-Coreano', locale: 'ko-KR' },
  { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano', locale: 'es-MX' },
  { code: 'INR', symbol: '₹', name: 'Rupia Indiana', locale: 'en-IN' },
  { code: 'SEK', symbol: 'kr', name: 'Coroa Sueca', locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr', name: 'Coroa Norueguesa', locale: 'nb-NO' },
  { code: 'PLN', symbol: 'zł', name: 'Zloty Polonês', locale: 'pl-PL' },
  { code: 'TRY', symbol: '₺', name: 'Lira Turca', locale: 'tr-TR' },
  { code: 'CLP', symbol: 'CLP', name: 'Peso Chileno', locale: 'es-CL' },
  { code: 'COP', symbol: 'COP', name: 'Peso Colombiano', locale: 'es-CO' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', locale: 'es-PE' },
  { code: 'UYU', symbol: '$U', name: 'Peso Uruguaio', locale: 'es-UY' },
]

export function getCurrency(code: string): CurrencyInfo {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0]
}

// Simple in-memory cache: key = "FROM-TO", value = { rate, timestamp }
const rateCache = new Map<string, { rate: number; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

const loading = ref(false)

export function useExchangeRate() {
  /**
   * Fetch the exchange rate from `from` currency to `to` currency.
   * Uses the free frankfurter.app API (no key needed).
   * Falls back to a secondary API if the first fails.
   */
  async function getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1

    const key = `${from}-${to}`
    const cached = rateCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.rate
    }

    loading.value = true
    try {
      // Primary: frankfurter.app (free, no key)
      const resp = await fetch(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      if (resp.ok) {
        const data = await resp.json()
        const rate = data.rates?.[to]
        if (typeof rate === 'number') {
          rateCache.set(key, { rate, timestamp: Date.now() })
          rateCache.set(`${to}-${from}`, { rate: 1 / rate, timestamp: Date.now() })
          return rate
        }
      }

      throw new Error('Primary API failed')
    } catch {
      // Secondary: exchangerate.host (free, no key)
      try {
        const resp2 = await fetch(
          `https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        )
        if (resp2.ok) {
          const data2 = await resp2.json()
          const rate = data2.result ?? data2.info?.rate
          if (typeof rate === 'number') {
            rateCache.set(key, { rate, timestamp: Date.now() })
            rateCache.set(`${to}-${from}`, { rate: 1 / rate, timestamp: Date.now() })
            return rate
          }
        }
      } catch {
        // ignore secondary failure
      }

      // Check if we have a stale cache entry
      if (cached) return cached.rate

      throw new Error(`Não foi possível obter a cotação ${from} → ${to}`)
    } finally {
      loading.value = false
    }
  }

  return { getRate, loading }
}

// ── Reactive sync access for computed properties ──

/** Reactive version counter — computeds that read getRateCached() depend on this */
export const ratesVersion = ref(0)

/**
 * Get a cached exchange rate synchronously. Returns 1 if rate not yet fetched.
 * Reads `ratesVersion` to establish reactive dependency.
 */
export function getRateCached(from: string, to: string): number {
  // Access reactive ref so computeds re-evaluate when rates are fetched
  ratesVersion.value
  if (from === to) return 1
  const key = `${from}-${to}`
  const cached = rateCache.get(key)
  return cached?.rate ?? 1
}

/**
 * Pre-fetch exchange rates for a list of currencies against a base currency.
 * After fetching, bumps ratesVersion to trigger reactive updates.
 */
export async function prefetchAccountRates(currencies: string[], baseCurrency: string) {
  const { getRate } = useExchangeRate()
  const unique = [...new Set(currencies)].filter(c => c !== baseCurrency)
  if (unique.length === 0) return

  const promises = unique.map(async (currency) => {
    try {
      await getRate(currency, baseCurrency)
    } catch {
      // fallback: rate stays as previously cached or 1
    }
  })
  await Promise.all(promises)
  ratesVersion.value++
}
