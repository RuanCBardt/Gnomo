<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full" style="background-color: #ec4899"></div>
        <h3 class="text-base font-semibold text-[#e8e8f0]">{{ t.reports.monthlyTrends }}</h3>
      </div>
      <div class="flex items-center gap-1 bg-[#0a0a0f] border border-[#2a2a4a]/60 rounded-xl p-1">
        <button
          v-for="opt in periodOptions"
          :key="opt.value"
          @click="numMonths = opt.value"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            numMonths === opt.value
              ? 'bg-[#7c5cfc]/15 text-[#7c5cfc]'
              : 'text-[#6a6a8a] hover:text-[#a0a0c0]',
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-5" style="height: 360px">
      <Bar :data="chartData" :options="chartOptions as any" />
    </div>

    <!-- Monthly breakdown table -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <div
        class="grid gap-3 px-5 py-3 border-b border-[#2a2a4a]/40 text-xs font-semibold text-[#6a6a8a] uppercase tracking-wider"
        style="grid-template-columns: 1fr 1fr 1fr 1fr"
      >
        <div>{{ t.reports.month }}</div>
        <div class="text-right">{{ t.reports.income }}</div>
        <div class="text-right">{{ t.reports.expenses }}</div>
        <div class="text-right">{{ t.reports.netMonth }}</div>
      </div>
      <div
        v-for="row in [...monthlyData].reverse()"
        :key="row.key"
        class="grid gap-3 px-5 py-2.5 border-b border-[#2a2a4a]/10 text-sm hover:bg-[#1a1a2e]/40 transition-colors"
        style="grid-template-columns: 1fr 1fr 1fr 1fr"
      >
        <div class="text-[#a0a0c0] font-medium">{{ row.label }}</div>
        <div class="text-right text-[#22c55e] tabular-nums">{{ formatCurrency(row.income, currency) }}</div>
        <div class="text-right text-[#f59e0b] tabular-nums">{{ formatCurrency(row.expenses, currency) }}</div>
        <div
          :class="['text-right tabular-nums font-semibold', row.net >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]']"
        >
          {{ formatCurrency(row.net, currency) }}
        </div>
      </div>
      <!-- Totals row -->
      <div
        class="grid gap-3 px-5 py-3.5 bg-[#1a1a2e]/40 border-t border-[#2a2a4a]/40 text-sm font-bold"
        style="grid-template-columns: 1fr 1fr 1fr 1fr"
      >
        <div class="text-[#6a6a8a] text-xs uppercase tracking-wider">Total</div>
        <div class="text-right text-[#22c55e] tabular-nums">{{ formatCurrency(totalIncome, currency) }}</div>
        <div class="text-right text-[#f59e0b] tabular-nums">{{ formatCurrency(totalExpenses, currency) }}</div>
        <div :class="['text-right tabular-nums', totalNet >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]']">
          {{ formatCurrency(totalNet, currency) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  PointElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { useAccountStore } from '@/stores/accounts'
import { useTransactionStore } from '@/stores/transactions'
import { formatCurrency } from '@/utils/accounting'
import { useI18n } from '@/i18n'

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, BarController,
  LineElement, PointElement, LineController,
  Filler, Title, Tooltip, Legend,
)

const { t } = useI18n()
const accountStore = useAccountStore()
const txStore = useTransactionStore()

const props = defineProps<{ currency: string }>()

const numMonths = ref(12)

const periodOptions = computed(() => [
  { value: 6, label: t.value.reports.months6 },
  { value: 12, label: t.value.reports.months12 },
  { value: 24, label: t.value.reports.months24 },
])

const monthlyData = computed(() => {
  const result = []
  const now = new Date()
  for (let i = numMonths.value - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleDateString(t.value.dateLocale, { month: 'short', year: '2-digit' })
    const key = `${year}-${String(month + 1).padStart(2, '0')}`

    let income = 0
    let expenses = 0
    for (const tx of txStore.transactions) {
      const [y, m] = tx.date.split('-').map(Number)
      if (y === year && m - 1 === month) {
        for (const split of tx.splits) {
          const acc = accountStore.getAccount(split.accountId)
          if (!acc) continue
          // income splits are negative (credit-normal account); invert for display
          if (acc.type === 'income') income += -split.amount
          // expense splits are positive (debit-normal account)
          if (acc.type === 'expense') expenses += split.amount
        }
      }
    }
    result.push({ key, label, income, expenses, net: income - expenses })
  }
  return result
})

const totalIncome = computed(() => monthlyData.value.reduce((s, r) => s + r.income, 0))
const totalExpenses = computed(() => monthlyData.value.reduce((s, r) => s + r.expenses, 0))
const totalNet = computed(() => totalIncome.value - totalExpenses.value)

const chartData = computed(() => ({
  labels: monthlyData.value.map(m => m.label),
  datasets: [
    {
      type: 'bar' as const,
      label: t.value.reports.income,
      data: monthlyData.value.map(m => m.income),
      backgroundColor: '#22c55e40',
      borderColor: '#22c55e',
      borderWidth: 1.5,
      borderRadius: 6,
      order: 2,
    },
    {
      type: 'bar' as const,
      label: t.value.reports.expenses,
      data: monthlyData.value.map(m => m.expenses),
      backgroundColor: '#f59e0b40',
      borderColor: '#f59e0b',
      borderWidth: 1.5,
      borderRadius: 6,
      order: 2,
    },
    {
      type: 'line' as const,
      label: t.value.reports.netMonth,
      data: monthlyData.value.map(m => m.net),
      borderColor: '#ec4899',
      backgroundColor: 'transparent',
      pointBackgroundColor: monthlyData.value.map(m => m.net >= 0 ? '#22c55e' : '#ef4444'),
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5,
      tension: 0.35,
      fill: false,
      order: 1,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      grid: { color: '#2a2a4a30' },
      ticks: { color: '#6a6a8a', font: { size: 10 } },
    },
    y: {
      grid: { color: '#2a2a4a30' },
      ticks: {
        color: '#6a6a8a',
        font: { size: 10 },
        callback: (v: any) => {
          const n = Number(v)
          if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
          if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}k`
          return n
        },
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: '#a0a0c0',
        font: { size: 11 },
        boxWidth: 12,
        padding: 14,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: '#12121a',
      titleColor: '#e8e8f0',
      bodyColor: '#a0a0c0',
      borderColor: '#2a2a4a',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12,
    },
  },
}
</script>
