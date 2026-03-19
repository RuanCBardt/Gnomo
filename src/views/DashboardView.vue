<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-[#e8e8f0]">{{ t.dashboard.title }}</h1>
        <p class="text-xs md:text-sm text-[#6a6a8a] mt-0.5">{{ t.dashboard.subtitle }}</p>
      </div>
      <div class="text-xs md:text-sm text-[#6a6a8a]">
        {{ currentDate }}
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        v-for="card in summaryCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :color="card.color"
        :trend="card.trend"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Monthly Income vs Expenses -->
      <div class="lg:col-span-2 bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-6 card-hover">
        <h3 class="text-sm font-semibold text-[#a0a0c0] mb-4">{{ t.dashboard.incomeVsExpenses }}</h3>
        <div class="h-64">
          <Bar :data="barChartData" :options="barChartOptions" />
        </div>
      </div>

      <!-- Expense Breakdown -->
      <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-6 card-hover">
        <h3 class="text-sm font-semibold text-[#a0a0c0] mb-4">{{ t.dashboard.expensesByCategory }}</h3>
        <div class="h-64 flex items-center justify-center">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden card-hover">
      <div class="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]/40">
        <h3 class="text-sm font-semibold text-[#a0a0c0]">{{ t.dashboard.recentTransactions }}</h3>
        <router-link to="/transactions" class="text-xs text-[#7c5cfc] hover:text-[#5c8cfc] transition-colors">
          {{ t.dashboard.viewAll }}
        </router-link>
      </div>
      <div class="divide-y divide-[#2a2a4a]/30">
        <div
          v-for="tx in recentTransactions"
          :key="tx.id"
          class="flex items-center justify-between px-4 md:px-6 py-3 md:py-3.5 hover:bg-[#1a1a2e]/50 transition-all duration-200 cursor-pointer group"
          @click="ui.openTransactionModal(tx.id)"
        >
          <div class="flex items-center gap-4">
            <div :class="[
              'w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
              getTxIconBg(tx)
            ]">
              <component :is="getTxIcon(tx)" class="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-medium text-[#e8e8f0]">{{ tx.description }}</p>
              <p class="text-xs text-[#6a6a8a]">{{ formatDate(tx.date) }}</p>
            </div>
          </div>
          <div class="text-right">
            <p :class="['text-sm font-semibold', getTxAmountColor(tx)]">
              {{ getTxDisplayAmount(tx) }}
            </p>
            <p class="text-xs text-[#6a6a8a]">{{ getTxAccountName(tx) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Balances -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-6 card-hover">
        <h3 class="text-sm font-semibold text-[#a0a0c0] mb-4">{{ t.dashboard.assetBalances }}</h3>
        <div class="space-y-3">
          <div
            v-for="acc in assetAccounts"
            :key="acc.id"
            class="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#1a1a2e]/50 transition-all duration-200"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-[#22c55e]"></div>
              <span class="text-sm text-[#e8e8f0]">{{ acc.name }}</span>
            </div>
            <span class="text-sm font-semibold text-[#22c55e]">{{ formatCurrency(accountStore.getAccountBalance(acc.id), acc.currency) }}</span>
          </div>
        </div>
      </div>

      <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-6 card-hover">
        <h3 class="text-sm font-semibold text-[#a0a0c0] mb-4">{{ t.dashboard.liabilityBalances }}</h3>
        <div class="space-y-3">
          <div
            v-for="acc in liabilityAccounts"
            :key="acc.id"
            class="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#1a1a2e]/50 transition-all duration-200"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-[#ef4444]"></div>
              <span class="text-sm text-[#e8e8f0]">{{ acc.name }}</span>
            </div>
            <span class="text-sm font-semibold text-[#ef4444]">{{ formatCurrency(accountStore.getAccountBalance(acc.id), acc.currency) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useTransactionStore } from '@/stores/transactions'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatDate, getMonthName } from '@/utils/accounting'
import { useI18n } from '@/i18n'
import type { Transaction } from '@/types'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PiggyBank,
} from 'lucide-vue-next'
import SummaryCard from '@/components/dashboard/SummaryCard.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const accountStore = useAccountStore()
const txStore = useTransactionStore()
const ui = useUIStore()
const { t } = useI18n()

const currentDate = computed(() => {
  return new Intl.DateTimeFormat(t.value.dateLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
})

// Summary cards data
const totalAssets = computed(() => accountStore.getAccountBalance('root-asset'))
const totalLiabilities = computed(() => accountStore.getAccountBalance('root-liability'))
const totalIncome = computed(() => accountStore.getAccountBalance('root-income'))
const totalExpenses = computed(() => accountStore.getAccountBalance('root-expense'))
const netWorth = computed(() => totalAssets.value - totalLiabilities.value)

const summaryCards = computed(() => [
  {
    label: t.value.dashboard.netWorth,
    value: formatCurrency(netWorth.value, ui.defaultCurrency),
    icon: PiggyBank,
    color: '#7c5cfc',
    trend: null,
  },
  {
    label: t.value.dashboard.totalAssets,
    value: formatCurrency(totalAssets.value, ui.defaultCurrency),
    icon: Wallet,
    color: '#22c55e',
    trend: null,
  },
  {
    label: t.value.dashboard.totalIncome,
    value: formatCurrency(totalIncome.value, ui.defaultCurrency),
    icon: ArrowUpRight,
    color: '#3b82f6',
    trend: null,
  },
  {
    label: t.value.dashboard.totalExpenses,
    value: formatCurrency(totalExpenses.value, ui.defaultCurrency),
    icon: ArrowDownRight,
    color: '#f59e0b',
    trend: null,
  },
])

// Chart data
const barChartData = computed(() => {
  const now = new Date()
  const labels: string[] = []
  const incomeData: number[] = []
  const expenseData: number[] = []

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    labels.push(getMonthName(start.getMonth(), t.value.months).substring(0, 3))

    const monthTxs = txStore.transactions.filter(tx => tx.date >= startStr && tx.date <= endStr)

    let income = 0
    let expense = 0
    for (const tx of monthTxs) {
      for (const split of tx.splits) {
        const acc = accountStore.getAccount(split.accountId)
        if (acc?.type === 'income') income += Math.abs(split.amount)
        if (acc?.type === 'expense') expense += Math.abs(split.amount)
      }
    }

    incomeData.push(income)
    expenseData.push(expense)
  }

  return {
    labels,
    datasets: [
      {
        label: t.value.dashboard.chartIncome,
        data: incomeData,
        backgroundColor: 'rgba(124, 92, 252, 0.7)',
        borderRadius: 6,
        barPercentage: 0.7,
      },
      {
        label: t.value.dashboard.chartExpenses,
        data: expenseData,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { color: '#a0a0c0', font: { size: 11 }, boxWidth: 12, borderRadius: 3, useBorderRadius: true },
    },
    tooltip: {
      backgroundColor: '#1a1a2e',
      titleColor: '#e8e8f0',
      bodyColor: '#a0a0c0',
      borderColor: '#2a2a4a',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#6a6a8a' } },
    y: { grid: { color: 'rgba(42, 42, 74, 0.3)' }, ticks: { color: '#6a6a8a' } },
  },
}

// Doughnut chart for expense breakdown
const doughnutData = computed(() => {
  const expenseAccounts = accountStore.getAccountsByType('expense')
  const labels: string[] = []
  const data: number[] = []
  const colors = [
    '#7c5cfc', '#5c8cfc', '#22c55e', '#f59e0b', '#ef4444',
    '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f97316',
  ]

  for (const acc of expenseAccounts) {
    const balance = accountStore.getAccountBalance(acc.id)
    if (balance > 0) {
      labels.push(acc.name)
      data.push(balance)
    }
  }

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: colors.slice(0, data.length),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#a0a0c0', font: { size: 10 }, boxWidth: 10, padding: 8, borderRadius: 3, useBorderRadius: true },
    },
    tooltip: {
      backgroundColor: '#1a1a2e',
      titleColor: '#e8e8f0',
      bodyColor: '#a0a0c0',
      borderColor: '#2a2a4a',
      borderWidth: 1,
      cornerRadius: 8,
    },
  },
}

// Recent transactions
const recentTransactions = computed(() => txStore.sortedTransactions.slice(0, 8))

// Account lists
const assetAccounts = computed(() => accountStore.getAccountsByType('asset'))
const liabilityAccounts = computed(() => accountStore.getAccountsByType('liability'))

// Transaction display helpers
function getTxIcon(tx: Transaction) {
  const firstSplit = tx.splits[0]
  const acc = accountStore.getAccount(firstSplit.accountId)
  if (acc?.type === 'income') return ArrowUpRight
  if (acc?.type === 'expense') return ArrowDownRight
  return ArrowLeftRight
}

function getTxIconBg(tx: Transaction): string {
  const firstSplit = tx.splits[0]
  const acc = accountStore.getAccount(firstSplit.accountId)
  if (acc?.type === 'income') return 'bg-gradient-to-br from-[#22c55e] to-[#16a34a]'
  if (acc?.type === 'expense') return 'bg-gradient-to-br from-[#ef4444] to-[#dc2626]'
  return 'bg-gradient-to-br from-[#7c5cfc] to-[#5c8cfc]'
}

function getTxAmountColor(tx: Transaction): string {
  const firstSplit = tx.splits[0]
  const acc = accountStore.getAccount(firstSplit.accountId)
  if (acc?.type === 'expense') return 'text-[#ef4444]'
  if (acc?.type === 'income') return 'text-[#22c55e]'
  return 'text-[#a0a0c0]'
}

function getTxDisplayAmount(tx: Transaction): string {
  const amount = Math.abs(tx.splits[0].amount)
  const acc = accountStore.getAccount(tx.splits[0].accountId)
  const prefix = acc?.type === 'expense' ? '- ' : acc?.type === 'income' ? '+ ' : ''
  return prefix + formatCurrency(amount, acc?.currency)
}

function getTxAccountName(tx: Transaction): string {
  const acc = accountStore.getAccount(tx.splits[0].accountId)
  return acc?.name ?? ''
}
</script>
