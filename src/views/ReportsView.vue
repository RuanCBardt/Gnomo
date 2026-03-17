<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-[#e8e8f0]">{{ t.reports.title }}</h1>
      <p class="text-sm text-[#6a6a8a] mt-0.5">{{ t.reports.subtitle }}</p>
    </div>

    <!-- Report Tabs -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          activeTab === tab.value
            ? 'shadow-sm'
            : 'text-[#6a6a8a] hover:text-[#a0a0c0] hover:bg-[#1a1a2e]'
        ]"
        :style="activeTab === tab.value ? {
          backgroundColor: tab.color + '15',
          color: tab.color,
          boxShadow: `0 2px 8px ${tab.color}15`,
        } : {}"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-5 transition-all duration-300 hover:border-[#2a2a4a]"
      >
        <div class="flex items-center gap-2 mb-2">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center"
            :style="{ backgroundColor: card.color + '15' }"
          >
            <component :is="card.icon" class="w-4 h-4" :style="{ color: card.color }" />
          </div>
          <span class="text-xs text-[#6a6a8a]">{{ card.label }}</span>
        </div>
        <p class="text-lg font-bold tabular-nums" :style="{ color: card.color }">
          {{ formatCurrency(card.value, ui.defaultCurrency) }}
        </p>
      </div>
    </div>

    <!-- Active Report Panel -->
    <ReportPanel
      v-if="activeTab === 'income'"
      :title="t.reports.incomeReport"
      :items="incomeItems"
      accent-color="#22c55e"
      :currency="ui.defaultCurrency"
      :empty-text="t.reports.noData"
    />

    <ReportPanel
      v-if="activeTab === 'expenses'"
      :title="t.reports.expensesReport"
      :items="expenseItems"
      accent-color="#f59e0b"
      :currency="ui.defaultCurrency"
      :empty-text="t.reports.noData"
    />

    <ReportPanel
      v-if="activeTab === 'assets'"
      :title="t.reports.assetsReport"
      :items="assetItems"
      accent-color="#22c55e"
      :currency="ui.defaultCurrency"
      :empty-text="t.reports.noData"
    />

    <!-- PROFIT & LOSS special view -->
    <template v-if="activeTab === 'pnl'">
      <!-- P&L Equation -->
      <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-6">
        <div class="flex items-center justify-center gap-6 text-center flex-wrap">
          <div>
            <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.income }}</p>
            <p class="text-xl font-bold text-[#22c55e]">{{ formatCurrency(totalIncome, ui.defaultCurrency) }}</p>
          </div>
          <span class="text-2xl text-[#6a6a8a]">−</span>
          <div>
            <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.expenses }}</p>
            <p class="text-xl font-bold text-[#f59e0b]">{{ formatCurrency(totalExpenses, ui.defaultCurrency) }}</p>
          </div>
          <span class="text-2xl text-[#6a6a8a]">=</span>
          <div>
            <p class="text-xs text-[#6a6a8a] mb-1">{{ profitLoss >= 0 ? t.reports.profit : t.reports.loss }}</p>
            <p :class="['text-2xl font-bold', profitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]']">
              {{ formatCurrency(Math.abs(profitLoss), ui.defaultCurrency) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Income breakdown -->
      <ReportPanel
        :title="t.reports.incomeReport"
        :items="incomeItems"
        accent-color="#22c55e"
        :currency="ui.defaultCurrency"
        :empty-text="t.reports.noData"
      />

      <!-- Expenses breakdown -->
      <ReportPanel
        :title="t.reports.expensesReport"
        :items="expenseItems"
        accent-color="#f59e0b"
        :currency="ui.defaultCurrency"
        :empty-text="t.reports.noData"
      />
    </template>

    <!-- NET WORTH special view -->
    <template v-if="activeTab === 'networth'">
      <!-- Net Worth Equation -->
      <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-6">
        <div class="flex items-center justify-center gap-6 text-center flex-wrap">
          <div>
            <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.assets }}</p>
            <p class="text-xl font-bold text-[#22c55e]">{{ formatCurrency(totalAssets, ui.defaultCurrency) }}</p>
          </div>
          <span class="text-2xl text-[#6a6a8a]">−</span>
          <div>
            <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.liabilities }}</p>
            <p class="text-xl font-bold text-[#ef4444]">{{ formatCurrency(totalLiabilities, ui.defaultCurrency) }}</p>
          </div>
          <span class="text-2xl text-[#6a6a8a]">=</span>
          <div>
            <p class="text-xs text-[#6a6a8a] mb-1">{{ t.reports.netWorth }}</p>
            <p :class="['text-2xl font-bold', netWorth >= 0 ? 'text-[#7c5cfc]' : 'text-[#ef4444]']">
              {{ formatCurrency(netWorth, ui.defaultCurrency) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Assets breakdown -->
      <ReportPanel
        :title="t.reports.assetsReport"
        :items="assetItems"
        accent-color="#22c55e"
        :currency="ui.defaultCurrency"
        :empty-text="t.reports.noData"
      />

      <!-- Liabilities breakdown -->
      <ReportPanel
        :title="t.reports.liabilitiesReport"
        :items="liabilityItems"
        accent-color="#ef4444"
        :currency="ui.defaultCurrency"
        :empty-text="t.reports.noData"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useUIStore } from '@/stores/ui'
import { formatCurrency } from '@/utils/accounting'
import { useI18n } from '@/i18n'
import type { AccountType } from '@/types'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  Receipt,
} from 'lucide-vue-next'
import ReportPanel from '@/components/reports/ReportPanel.vue'
import type { ReportItem } from '@/components/reports/ReportPanel.vue'

const accountStore = useAccountStore()
const ui = useUIStore()
const { t } = useI18n()

const activeTab = ref<'income' | 'expenses' | 'assets' | 'pnl' | 'networth'>('expenses')

const tabs = computed(() => [
  { value: 'income' as const, label: t.value.reports.incomeReport, icon: TrendingUp, color: '#22c55e' },
  { value: 'expenses' as const, label: t.value.reports.expensesReport, icon: TrendingDown, color: '#f59e0b' },
  { value: 'assets' as const, label: t.value.reports.assetsReport, icon: Wallet, color: '#3b82f6' },
  { value: 'pnl' as const, label: t.value.reports.profitAndLoss, icon: Receipt, color: '#ec4899' },
  { value: 'networth' as const, label: t.value.reports.netWorth, icon: Scale, color: '#7c5cfc' },
])

// Data helpers
function getLeafBalances(type: AccountType): ReportItem[] {
  const typeLabels: Partial<Record<AccountType, string>> = {
    asset: t.value.accountTypes.asset,
    liability: t.value.accountTypes.liability,
    equity: t.value.accountTypes.equity,
    income: t.value.accountTypes.income,
    expense: t.value.accountTypes.expense,
  }
  const accounts = accountStore.getAccountsByType(type)
  const items: ReportItem[] = []
  for (const acc of accounts) {
    const balance = accountStore.getAccountBalance(acc.id)
    if (Math.abs(balance) > 0.01) {
      items.push({
        name: accountStore.getDisplayName(acc, typeLabels),
        value: Math.abs(balance),
      })
    }
  }
  return items
}

const incomeItems = computed(() => getLeafBalances('income'))
const expenseItems = computed(() => getLeafBalances('expense'))
const assetItems = computed(() => getLeafBalances('asset'))
const liabilityItems = computed(() => getLeafBalances('liability'))

const totalAssets = computed(() => accountStore.getAccountBalance('root-asset'))
const totalLiabilities = computed(() => accountStore.getAccountBalance('root-liability'))
const totalIncome = computed(() => accountStore.getAccountBalance('root-income'))
const totalExpenses = computed(() => accountStore.getAccountBalance('root-expense'))
const netWorth = computed(() => totalAssets.value - totalLiabilities.value)
const profitLoss = computed(() => totalIncome.value - totalExpenses.value)

const summaryCards = computed(() => [
  { label: t.value.reports.totalIncome, value: totalIncome.value, icon: TrendingUp, color: '#22c55e' },
  { label: t.value.reports.totalExpenses, value: totalExpenses.value, icon: TrendingDown, color: '#f59e0b' },
  { label: t.value.reports.totalAssets, value: totalAssets.value, icon: Wallet, color: '#3b82f6' },
  { label: t.value.reports.netWorth, value: netWorth.value, icon: Scale, color: '#7c5cfc' },
])
</script>
