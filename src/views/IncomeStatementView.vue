<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <router-link to="/reports" class="text-xs text-[#7c5cfc] hover:text-[#5c8cfc] transition-colors">
          ← {{ t.nav.reports }}
        </router-link>
        <h1 class="text-2xl font-bold text-[#e8e8f0] mt-1">{{ t.reports.incomeStatement }}</h1>
        <p class="text-sm text-[#6a6a8a] mt-0.5">{{ t.reports.period }} {{ formatDate(dateFrom, t.dateLocale) }} {{ t.common.to }} {{ formatDate(dateTo, t.dateLocale) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model="dateFrom"
          type="date"
          class="px-3 py-2 rounded-xl bg-[#12121a] border border-[#2a2a4a]/60 text-sm text-[#e8e8f0]
                 focus:outline-none focus:border-[#7c5cfc]/50 transition-all"
        />
      <span class="text-[#6a6a8a] text-xs">{{ t.common.to }}</span>
        <input
          v-model="dateTo"
          type="date"
          class="px-3 py-2 rounded-xl bg-[#12121a] border border-[#2a2a4a]/60 text-sm text-[#e8e8f0]
                 focus:outline-none focus:border-[#7c5cfc]/50 transition-all"
        />
      </div>
    </div>

    <!-- Net Result -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-6">
      <div class="flex items-center justify-center gap-8 text-center">
        <div>
          <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.income }}</p>
          <p class="text-xl font-bold text-[#22c55e]">{{ formatCurrency(totalIncome, ui.defaultCurrency) }}</p>
        </div>
        <span class="text-2xl text-[#6a6a8a]">−</span>
        <div>
          <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.expenses }}</p>
          <p class="text-xl font-bold text-[#ef4444]">{{ formatCurrency(totalExpenses, ui.defaultCurrency) }}</p>
        </div>
        <span class="text-2xl text-[#6a6a8a]">=</span>
        <div>
          <p class="text-xs text-[#6a6a8a] mb-1">{{ netResult >= 0 ? t.reports.profit : t.reports.loss }}</p>
          <p :class="['text-xl font-bold', netResult >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]']">
            {{ formatCurrency(Math.abs(netResult), ui.defaultCurrency) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BalanceSection :title="t.accountTypes.income" :tree="incomeTree" color="#22c55e" />
      <BalanceSection :title="t.accountTypes.expense" :tree="expenseTree" color="#ef4444" />
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

const now = new Date()
const dateFrom = ref(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
const dateTo = ref(today())

const incomeTree = computed(() => accountStore.getAccountBalanceTree('income'))
const expenseTree = computed(() => accountStore.getAccountBalanceTree('expense'))

const totalIncome = computed(() => incomeTree.value[0]?.balance ?? 0)
const totalExpenses = computed(() => expenseTree.value[0]?.balance ?? 0)
const netResult = computed(() => totalIncome.value - totalExpenses.value)
</script>
