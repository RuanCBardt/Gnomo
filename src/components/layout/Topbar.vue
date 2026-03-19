<template>
  <header class="flex items-center justify-between h-14 md:h-16 px-4 md:px-6 border-b border-[#2a2a4a]/40 bg-[#0d0d15]/80 backdrop-blur-sm shrink-0">
    <!-- Left: Logo on mobile -->
    <div class="flex items-center gap-2 md:hidden">
      <div class="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c5cfc] to-[#5c8cfc] shadow-lg shadow-[#7c5cfc]/20">
        <Landmark class="w-4 h-4 text-white" />
      </div>
      <span class="text-base font-bold tracking-tight bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] bg-clip-text text-transparent">
        Gnomo
      </span>
    </div>
    <div class="hidden md:block"></div>

    <!-- Right side -->
    <div class="flex items-center gap-3">
      <!-- Quick stats -->
      <div class="hidden md:flex items-center gap-4 mr-4 text-xs text-[#a0a0c0]">
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
          <span>{{ txCount }} {{ t.common.transactions }}</span>
        </div>
      </div>

      <!-- Profile -->
      <button class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#1a1a2e] transition-all duration-200">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c5cfc] to-[#5c8cfc] flex items-center justify-center text-white text-sm font-bold">
          G
        </div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { useI18n } from '@/i18n'
import { Landmark } from 'lucide-vue-next'

const txStore = useTransactionStore()
const txCount = computed(() => txStore.transactions.length)
const { t } = useI18n()
</script>
