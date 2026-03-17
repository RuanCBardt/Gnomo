<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-[#e8e8f0]">{{ t.settings.title }}</h1>
      <p class="text-sm text-[#6a6a8a] mt-0.5">{{ t.settings.subtitle }}</p>
    </div>

    <!-- Language -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-[#2a2a4a]/40">
        <h2 class="text-sm font-semibold text-[#e8e8f0]">{{ t.settings.language }}</h2>
        <p class="text-xs text-[#6a6a8a] mt-0.5">{{ t.settings.languageDesc }}</p>
      </div>
      <div class="px-6 py-4">
        <select
          :value="ui.language"
          @change="ui.setLanguage(($event.target as HTMLSelectElement).value as any)"
          class="w-full max-w-sm px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
                 focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/30
                 transition-all duration-200 appearance-none"
        >
          <option value="pt">{{ t.languages.pt }}</option>
          <option value="en">{{ t.languages.en }}</option>
        </select>
      </div>
    </div>

    <!-- Currency -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-[#2a2a4a]/40">
        <h2 class="text-sm font-semibold text-[#e8e8f0]">{{ t.settings.defaultCurrency }}</h2>
        <p class="text-xs text-[#6a6a8a] mt-0.5">{{ t.settings.currencyDesc }}</p>
      </div>
      <div class="px-6 py-4">
        <select
          :value="ui.defaultCurrency"
          @change="ui.setDefaultCurrency(($event.target as HTMLSelectElement).value)"
          class="w-full max-w-sm px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
                 focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/30
                 transition-all duration-200 appearance-none"
        >
          <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
            {{ c.symbol }} {{ c.code }} — {{ (t.currencies as any)[c.code] || c.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Data -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-[#2a2a4a]/40">
        <h2 class="text-sm font-semibold text-[#e8e8f0]">{{ t.settings.data }}</h2>
        <p class="text-xs text-[#6a6a8a] mt-0.5">{{ t.settings.dataDesc }}</p>
      </div>
      <div class="px-6 py-4 flex items-center gap-4">
        <button
          @click="exportData"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                 bg-[#1a1a2e] text-[#a0a0c0] hover:text-[#e8e8f0] hover:bg-[#2a2a4a]
                 transition-all duration-200"
        >
          <Download class="w-4 h-4" />
          {{ t.settings.export }}
        </button>
        <label
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                 bg-[#1a1a2e] text-[#a0a0c0] hover:text-[#e8e8f0] hover:bg-[#2a2a4a]
                 transition-all duration-200 cursor-pointer"
        >
          <Upload class="w-4 h-4" />
          {{ t.settings.import }}
          <input type="file" accept=".json" class="hidden" @change="importData" />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { useAccountStore } from '@/stores/accounts'
import { useTransactionStore } from '@/stores/transactions'
import { CURRENCIES } from '@/utils/currency'
import { useI18n } from '@/i18n'
import { Download, Upload } from 'lucide-vue-next'

const ui = useUIStore()
const accountStore = useAccountStore()
const txStore = useTransactionStore()
const { t } = useI18n()

function exportData() {
  const data = {
    settings: { defaultCurrency: ui.defaultCurrency, language: ui.language },
    accounts: accountStore.accounts,
    transactions: txStore.transactions,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gnomo-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      if (data.accounts && Array.isArray(data.accounts)) {
        accountStore.accounts.splice(0, accountStore.accounts.length, ...data.accounts)
        accountStore.persist()
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        txStore.transactions.splice(0, txStore.transactions.length, ...data.transactions)
        txStore.persist()
      }
      if (data.settings?.defaultCurrency) {
        ui.setDefaultCurrency(data.settings.defaultCurrency)
      }
      if (data.settings?.language) {
        ui.setLanguage(data.settings.language)
      }
    } catch {
      alert(t.value.settings.invalidFile)
    }
  }
  reader.readAsText(file)
  input.value = ''
}
</script>
