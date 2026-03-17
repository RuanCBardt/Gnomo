import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { pt } from './pt'
import { en } from './en'

export type Locale = 'pt' | 'en'

export const messages = { pt, en } as const

export type TranslationKeys = typeof pt

export function useI18n() {
  const ui = useUIStore()
  const t = computed(() => messages[ui.language])
  return { t }
}
