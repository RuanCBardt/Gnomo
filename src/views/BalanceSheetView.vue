<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <router-link to="/reports" class="text-xs text-[#7c5cfc] hover:text-[#5c8cfc] transition-colors">
          ← {{ t.nav.reports }}
        </router-link>
        <h1 class="text-2xl font-bold text-[#e8e8f0] mt-1">{{ t.reports.balanceSheet }}</h1>
        <p class="text-sm text-[#6a6a8a] mt-0.5">{{ t.reports.financialPosition }} {{ formatDate(asOfDate, t.dateLocale) }}</p>
      </div>
      <input
        v-model="asOfDate"
        type="date"
        class="px-3 py-2 rounded-xl bg-[#12121a] border border-[#2a2a4a]/60 text-sm text-[#e8e8f0]
               focus:outline-none focus:border-[#7c5cfc]/50 transition-all"
      />
    </div>

    <!-- Accounting Equation -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-6">
      <div class="flex items-center justify-center gap-4 text-center">
        <div>
          <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.assets }}</p>
          <p class="text-xl font-bold text-[#22c55e]">{{ formatCurrency(totalAssets, ui.defaultCurrency) }}</p>
        </div>
        <span class="text-2xl text-[#6a6a8a]">=</span>
        <div>
          <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.liabilities }}</p>
          <p class="text-xl font-bold text-[#ef4444]">{{ formatCurrency(totalLiabilities, ui.defaultCurrency) }}</p>
        </div>
        <span class="text-2xl text-[#6a6a8a]">+</span>
        <div>
          <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.equity }}</p>
          <p class="text-xl font-bold text-[#7c5cfc]">{{ formatCurrency(totalEquity, ui.defaultCurrency) }}</p>
        </div>
      </div>
      <div class="mt-3 text-center">
        <span :class="[
          'text-xs px-3 py-1 rounded-full',
          isBalanced ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#ef4444]/10 text-[#ef4444]'
        ]">
          {{ isBalanced ? t.reports.balanced : t.reports.unbalanced }}
        </span>
      </div>
    </div>

    <!-- Balance Sheet sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Assets -->
      <BalanceSection :title="t.accountTypes.asset" :tree="assetTree" color="#22c55e" />

      <!-- Liabilities + Equity -->
      <div class="space-y-6">
        <BalanceSection :title="t.accountTypes.liability" :tree="liabilityTree" color="#ef4444" />
        <BalanceSection :title="t.accountTypes.equity" :tree="equityTree" color="#7c5cfc" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatDate, today } from '@/utils/accounting'
import { useI18n } from '@/i18n'
import BalanceSection from '@/components/reports/BalanceSection.vue'

const accountStore = useAccountStore()
const ui = useUIStore()
const { t } = useI18n()
const asOfDate = ref(today())

const assetTree = computed(() => accountStore.getAccountBalanceTree('asset'))
const liabilityTree = computed(() => accountStore.getAccountBalanceTree('liability'))
const equityTree = computed(() => accountStore.getAccountBalanceTree('equity'))

const totalAssets = computed(() => assetTree.value[0]?.balance ?? 0)
const totalLiabilities = computed(() => liabilityTree.value[0]?.balance ?? 0)
const totalEquity = computed(() => {
  const eq = equityTree.value[0]?.balance ?? 0
  // Net income = income - expense
  const income = accountStore.getAccountBalance('root-income')
  const expense = accountStore.getAccountBalance('root-expense')
  return eq + income - expense
})
const isBalanced = computed(() =>
  Math.abs(totalAssets.value - totalLiabilities.value - totalEquity.value) < 0.01
)
</script>
