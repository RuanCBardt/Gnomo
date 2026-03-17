import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Locale } from '@/i18n'

export const useUIStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const transactionModalOpen = ref(false)
  const editingTransactionId = ref<string | null>(null)
  const searchQuery = ref('')
  const defaultCurrency = ref('GBP')
  const language = ref<Locale>('en')

  function initSettings() {
    const saved = localStorage.getItem('gnomo-settings')
    if (saved) {
      const s = JSON.parse(saved)
      if (s.defaultCurrency) defaultCurrency.value = s.defaultCurrency
      if (s.language) language.value = s.language
    }
  }

  function persistSettings() {
    localStorage.setItem('gnomo-settings', JSON.stringify({
      defaultCurrency: defaultCurrency.value,
      language: language.value,
    }))
  }

  function setDefaultCurrency(code: string) {
    defaultCurrency.value = code
    persistSettings()
  }

  function setLanguage(lang: Locale) {
    language.value = lang
    persistSettings()
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function openTransactionModal(transactionId?: string) {
    editingTransactionId.value = transactionId ?? null
    transactionModalOpen.value = true
  }

  function closeTransactionModal() {
    transactionModalOpen.value = false
    editingTransactionId.value = null
  }

  initSettings()

  return {
    sidebarCollapsed,
    transactionModalOpen,
    editingTransactionId,
    searchQuery,
    defaultCurrency,
    language,
    toggleSidebar,
    openTransactionModal,
    closeTransactionModal,
    setDefaultCurrency,
    setLanguage,
  }
})
