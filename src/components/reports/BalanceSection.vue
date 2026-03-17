<template>
  <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden card-hover">
    <!-- Section Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]/40">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: color }"></div>
        <h3 class="text-sm font-semibold text-[#a0a0c0]">{{ title }}</h3>
      </div>
      <span class="text-sm font-bold" :style="{ color }">
        {{ formatCurrency(tree[0]?.balance ?? 0) }}
      </span>
    </div>

    <!-- Tree items -->
    <div class="divide-y divide-[#2a2a4a]/20">
      <template v-for="node in tree" :key="node.account.id">
        <BalanceRow
          v-for="child in node.children"
          :key="child.account.id"
          :node="child"
          :depth="0"
          :color="color"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccountBalance } from '@/types'
import { formatCurrency } from '@/utils/accounting'
import BalanceRow from './BalanceRow.vue'

defineProps<{
  title: string
  tree: AccountBalance[]
  color: string
}>()
</script>
