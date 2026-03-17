<template>
  <div class="space-y-4">
    <!-- View Mode Toggle -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: accentColor }"
        ></div>
        <h3 class="text-base font-semibold text-[#e8e8f0]">{{ title }}</h3>
        <span class="text-sm font-bold tabular-nums" :style="{ color: accentColor }">
          {{ formatCurrency(total, currency) }}
        </span>
      </div>
      <div class="flex items-center gap-1 bg-[#0a0a0f] border border-[#2a2a4a]/60 rounded-xl p-1">
        <button
          v-for="mode in modes"
          :key="mode.value"
          @click="viewMode = mode.value"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            viewMode === mode.value
              ? 'bg-[#7c5cfc]/15 text-[#7c5cfc] shadow-sm'
              : 'text-[#6a6a8a] hover:text-[#a0a0c0]'
          ]"
        >
          <component :is="mode.icon" class="w-3.5 h-3.5" />
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <!-- LIST VIEW -->
      <div v-if="viewMode === 'list'" class="divide-y divide-[#2a2a4a]/30">
        <div
          v-for="(item, idx) in sortedItems"
          :key="item.name"
          class="flex items-center justify-between px-5 py-3.5 hover:bg-[#1a1a2e]/50 transition-all duration-200 group"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: getColor(idx) }"></div>
            <span class="text-sm text-[#e8e8f0] truncate">{{ item.name }}</span>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <!-- Percentage bar -->
            <div class="w-24 h-1.5 rounded-full bg-[#2a2a4a]/40 overflow-hidden hidden sm:block">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                  backgroundColor: getColor(idx),
                }"
              ></div>
            </div>
            <span class="text-xs text-[#6a6a8a] tabular-nums w-10 text-right">
              {{ total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0' }}%
            </span>
            <span class="text-sm font-semibold tabular-nums text-right w-28" :style="{ color: getColor(idx) }">
              {{ formatCurrency(item.value, currency) }}
            </span>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="sortedItems.length === 0" class="px-6 py-12 text-center">
          <p class="text-[#6a6a8a] text-sm">{{ emptyText }}</p>
        </div>
      </div>

      <!-- PIE VIEW -->
      <div v-else-if="viewMode === 'pie'" class="p-6">
        <div v-if="sortedItems.length > 0" class="flex items-center justify-center" style="height: 340px">
          <Doughnut :data="pieData" :options="pieOptions" />
        </div>
        <div v-else class="py-12 text-center">
          <p class="text-[#6a6a8a] text-sm">{{ emptyText }}</p>
        </div>
      </div>

      <!-- BAR VIEW -->
      <div v-else-if="viewMode === 'bar'" class="p-6">
        <div v-if="sortedItems.length > 0" style="height: 340px">
          <Bar :data="barData" :options="barOptions" />
        </div>
        <div v-else class="py-12 text-center">
          <p class="text-[#6a6a8a] text-sm">{{ emptyText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
import { List, PieChart, BarChart3 } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/accounting'
import { useI18n } from '@/i18n'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const { t } = useI18n()

const PALETTE = [
  '#7c5cfc', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f97316',
  '#a855f7', '#14b8a6', '#e11d48', '#0ea5e9', '#84cc16',
  '#d946ef', '#facc15', '#fb923c', '#2dd4bf', '#818cf8',
]

export interface ReportItem {
  name: string
  value: number
}

const props = defineProps<{
  title: string
  items: ReportItem[]
  accentColor: string
  currency: string
  emptyText?: string
}>()

const viewMode = ref<'list' | 'pie' | 'bar'>('list')

const modes = computed(() => [
  { value: 'list' as const, icon: List, label: t.value.reports.viewList },
  { value: 'pie' as const, icon: PieChart, label: t.value.reports.viewPie },
  { value: 'bar' as const, icon: BarChart3, label: t.value.reports.viewBar },
])

const sortedItems = computed(() =>
  [...props.items].sort((a, b) => b.value - a.value)
)

const total = computed(() => props.items.reduce((sum, i) => sum + i.value, 0))

function getColor(idx: number): string {
  return PALETTE[idx % PALETTE.length]
}

// PIE
const pieData = computed(() => ({
  labels: sortedItems.value.map(i => i.name),
  datasets: [{
    data: sortedItems.value.map(i => i.value),
    backgroundColor: sortedItems.value.map((_, i) => getColor(i)),
    borderWidth: 0,
    hoverOffset: 10,
  }],
}))

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#a0a0c0',
        font: { size: 11 },
        boxWidth: 12,
        padding: 12,
        borderRadius: 3,
        useBorderRadius: true,
      },
    },
    tooltip: {
      backgroundColor: '#12121a',
      titleColor: '#e8e8f0',
      bodyColor: '#a0a0c0',
      borderColor: '#2a2a4a',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 14,
    },
  },
}

// BAR
const barData = computed(() => ({
  labels: sortedItems.value.map(i => i.name),
  datasets: [{
    data: sortedItems.value.map(i => i.value),
    backgroundColor: sortedItems.value.map((_, i) => getColor(i) + 'cc'),
    borderRadius: 8,
    barPercentage: 0.6,
    maxBarThickness: 50,
  }],
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#12121a',
      titleColor: '#e8e8f0',
      bodyColor: '#a0a0c0',
      borderColor: '#2a2a4a',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 14,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(42, 42, 74, 0.2)' },
      ticks: { color: '#6a6a8a', font: { size: 10 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#a0a0c0', font: { size: 11 } },
    },
  },
}
</script>
