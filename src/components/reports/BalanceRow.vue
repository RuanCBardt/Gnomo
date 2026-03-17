<template>
  <div>
    <div
      class="flex items-center justify-between px-6 py-2.5 hover:bg-[#1a1a2e]/30 transition-all duration-200"
      :style="{ paddingLeft: `${depth * 20 + 24}px` }"
    >
      <span :class="[
        'text-sm',
        node.children.length > 0 ? 'text-[#a0a0c0] font-medium' : 'text-[#e8e8f0]'
      ]">
        {{ node.account.name }}
      </span>
      <span class="text-sm font-semibold tabular-nums" :style="{ color }">
        {{ formatCurrency(node.balance, node.account.currency) }}
      </span>
    </div>
    <BalanceRow
      v-for="child in node.children"
      :key="child.account.id"
      :node="child"
      :depth="depth + 1"
      :color="color"
    />
  </div>
</template>

<script setup lang="ts">
import type { AccountBalance } from '@/types'
import { formatCurrency } from '@/utils/accounting'

defineProps<{
  node: AccountBalance
  depth: number
  color: string
}>()
</script>
