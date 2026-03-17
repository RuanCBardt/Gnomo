<template>
  <header class="flex items-center justify-between h-16 px-6 border-b border-[#2a2a4a]/40 bg-[#0d0d15]/80 backdrop-blur-sm shrink-0">
    <!-- Search -->
    <div class="relative flex items-center flex-1 max-w-md">
      <Search class="absolute left-3 w-4 h-4 text-[#6a6a8a]" />
      <input
        v-model="ui.searchQuery"
        type="text"
        :placeholder="t.topbar.searchPlaceholder"
        class="w-full pl-10 pr-4 py-2 rounded-xl bg-[#12121a] border border-[#2a2a4a]/60 text-sm text-[#e8e8f0] placeholder:text-[#6a6a8a]
               focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/30
               transition-all duration-200"
      />
      <kbd class="absolute right-3 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#6a6a8a] bg-[#1a1a2e] border border-[#2a2a4a] rounded">
        ⌘K
      </kbd>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-3 ml-4">
      <!-- Quick stats -->
      <div class="hidden md:flex items-center gap-4 mr-4 text-xs text-[#a0a0c0]">
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
          <span>{{ txCount }} {{ t.common.transactions }}</span>
        </div>
      </div>

      <!-- Notifications -->
      <button class="relative p-2 rounded-xl text-[#6a6a8a] hover:text-[#e8e8f0] hover:bg-[#1a1a2e] transition-all duration-200">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#7c5cfc]"></span>
      </button>

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
import { useUIStore } from '@/stores/ui'
import { useTransactionStore } from '@/stores/transactions'
import { useI18n } from '@/i18n'
import { Search, Bell } from 'lucide-vue-next'

const ui = useUIStore()
const txStore = useTransactionStore()
const txCount = computed(() => txStore.transactions.length)
const { t } = useI18n()
</script>
