<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[#e8e8f0]">Relatórios</h1>
      <p class="text-sm text-[#6a6a8a] mt-0.5">Análises financeiras e demonstrações contábeis</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="report in reports"
        :key="report.to"
        :to="report.to"
        :class="[
          'group relative overflow-hidden rounded-2xl border border-[#2a2a4a]/60 bg-[#12121a] p-6',
          'transition-all duration-300 hover:border-[#2a2a4a] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1',
        ]"
      >
        <!-- Glow -->
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          :style="{ background: `radial-gradient(ellipse at 50% 0%, ${report.color}15, transparent 70%)` }"
        ></div>

        <div class="relative">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
            :style="{ backgroundColor: report.color + '15' }"
          >
            <component :is="report.icon" class="w-6 h-6" :style="{ color: report.color }" />
          </div>
          <h3 class="text-lg font-semibold text-[#e8e8f0] mb-1">{{ report.label }}</h3>
          <p class="text-sm text-[#6a6a8a]">{{ report.description }}</p>
        </div>

        <div class="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          :style="{ background: `linear-gradient(90deg, transparent, ${report.color}40, transparent)` }"
        ></div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Scale,
  TrendingUp,
  PieChart,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const reports = computed(() => [
  {
    to: '/reports/balance-sheet',
    label: t.value.reports.balanceSheet,
    description: t.value.reports.balanceSheetDesc,
    icon: Scale,
    color: '#7c5cfc',
  },
  {
    to: '/reports/income-statement',
    label: t.value.reports.incomeStatement,
    description: t.value.reports.incomeStatementDesc,
    icon: TrendingUp,
    color: '#22c55e',
  },
  {
    to: '/reports',
    label: t.value.reports.cashFlow,
    description: t.value.reports.cashFlowDesc,
    icon: PieChart,
    color: '#f59e0b',
  },
])
</script>
