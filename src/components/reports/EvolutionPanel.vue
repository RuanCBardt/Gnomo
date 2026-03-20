<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full" style="background-color: #7c5cfc"></div>
        <h3 class="text-base font-semibold text-[#e8e8f0]">{{ t.reports.netWorthEvolution }}</h3>
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

    <!-- KPI cards -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-5">
        <p class="text-xs text-[#6a6a8a] mb-1.5">{{ t.reports.assets }}</p>
        <p class="text-lg font-bold text-[#22c55e] tabular-nums">
          {{ formatCurrency(currentAssets, currency) }}
        </p>
      </div>
      <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-5">
        <p class="text-xs text-[#6a6a8a] mb-1.5">{{ t.reports.liabilities }}</p>
        <p class="text-lg font-bold text-[#ef4444] tabular-nums">
          {{ formatCurrency(currentLiabilities, currency) }}
        </p>
      </div>
      <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-5">
        <p class="text-xs text-[#6a6a8a] mb-1.5">{{ t.reports.netWorth }}</p>
        <p
          :class="['text-lg font-bold tabular-nums', currentNetWorth >= 0 ? 'text-[#7c5cfc]' : 'text-[#ef4444]']"
        >
          {{ formatCurrency(currentNetWorth, currency) }}
        </p>
        <p v-if="change !== null" :class="['text-xs mt-1', change >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]']">
          {{ change >= 0 ? '+' : '' }}{{ formatCurrency(change, currency) }} vs. mês anterior
        </p>
      </div>
    </div>

    <!-- Line chart -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl p-5" style="height: 340px">
      <Line :data="chartData" :options="chartOptions as any" />
    </div>

    <!-- Stacked area: assets vs liabilities per month table -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <div
        class="grid gap-3 px-5 py-3 border-b border-[#2a2a4a]/40 text-xs font-semibold text-[#6a6a8a] uppercase tracking-wider"
        style="grid-template-columns: 1fr 1fr 1fr 1fr"
      >
        <div>{{ t.reports.month }}</div>
        <div class="text-right">{{ t.reports.assets }}</div>
        <div class="text-right">{{ t.reports.liabilities }}</div>
        <div class="text-right">{{ t.reports.netWorth }}</div>
      </div>
      <div
        v-for="row in [...evolutionData].reverse()"
        :key="row.label"
        class="grid gap-3 px-5 py-2.5 border-b border-[#2a2a4a]/10 text-sm hover:bg-[#1a1a2e]/40 transition-colors"
        style="grid-template-columns: 1fr 1fr 1fr 1fr"
      >
        <div class="text-[#a0a0c0] font-medium">{{ row.label }}</div>
        <div class="text-right text-[#22c55e] tabular-nums">{{ formatCurrency(row.assets, currency) }}</div>
        <div class="text-right text-[#ef4444] tabular-nums">{{ formatCurrency(row.liabilities, currency) }}</div>
        <div
          :class="['text-right tabular-nums font-semibold', row.netWorth >= 0 ? 'text-[#7c5cfc]' : 'text-[#ef4444]']"
        >
          {{ formatCurrency(row.netWorth, currency) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
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
  LineElement, PointElement, LineController,
  Filler, Title, Tooltip, Legend,
)

const { t } = useI18n()
const accountStore = useAccountStore()
const txStore = useTransactionStore()

defineProps<{ currency: string }>()

const numMonths = ref(12)

const periodOptions = computed(() => [
  { value: 6, label: t.value.reports.months6 },
  { value: 12, label: t.value.reports.months12 },
  { value: 24, label: t.value.reports.months24 },
])

// Net worth at end of a given month (cumulative snapshot).
// net_worth = Σ(asset splits up to date) + Σ(liability splits up to date)
// This works because liability splits are negative when liability increases,
// so asset_total + liability_total_signed = assets - liabilities_owed.
function getSnapshotAtMonthEnd(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]
  let assets = 0
  let liabilities = 0

  for (const tx of txStore.transactions) {
    if (tx.date <= lastDay) {
      for (const split of tx.splits) {
        const acc = accountStore.getAccount(split.accountId)
        if (!acc) continue
        if (acc.type === 'asset') assets += split.amount
        else if (acc.type === 'liability') liabilities += split.amount
      }
    }
  }

  // liabilitiesOwed = -(sum of liability splits); we store as positive
  const liabilitiesOwed = -liabilities
  const netWorth = assets - liabilitiesOwed

  return { assets, liabilities: liabilitiesOwed, netWorth }
}

const evolutionData = computed(() => {
  const result = []
  const now = new Date()
  for (let i = numMonths.value - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString(t.value.dateLocale, { month: 'short', year: '2-digit' })
    const snap = getSnapshotAtMonthEnd(d.getFullYear(), d.getMonth())
    result.push({ label, ...snap })
  }
  return result
})

const current = computed(() => evolutionData.value[evolutionData.value.length - 1])
const prev = computed(() => evolutionData.value[evolutionData.value.length - 2])
const currentAssets = computed(() => current.value?.assets ?? 0)
const currentLiabilities = computed(() => current.value?.liabilities ?? 0)
const currentNetWorth = computed(() => current.value?.netWorth ?? 0)
const change = computed(() =>
  prev.value != null ? currentNetWorth.value - prev.value.netWorth : null
)

const chartData = computed(() => ({
  labels: evolutionData.value.map(m => m.label),
  datasets: [
    {
      label: t.value.reports.assets,
      data: evolutionData.value.map(m => m.assets),
      borderColor: '#22c55e',
      backgroundColor: '#22c55e15',
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 1.5,
      tension: 0.35,
      fill: true,
    },
    {
      label: t.value.reports.liabilities,
      data: evolutionData.value.map(m => m.liabilities),
      borderColor: '#ef4444',
      backgroundColor: '#ef444415',
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 1.5,
      tension: 0.35,
      fill: true,
    },
    {
      label: t.value.reports.cumulativeNW,
      data: evolutionData.value.map(m => m.netWorth),
      borderColor: '#7c5cfc',
      backgroundColor: '#7c5cfc20',
      pointBackgroundColor: '#7c5cfc',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5,
      tension: 0.35,
      fill: false,
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
