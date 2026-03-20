<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-[#06b6d4]"></div>
        <h3 class="text-base font-semibold text-[#e8e8f0]">{{ t.reports.trialBalance }}</h3>
        <span
          :class="[
            'text-xs px-2.5 py-1 rounded-full font-medium',
            isBalanced
              ? 'bg-[#22c55e]/10 text-[#22c55e]'
              : 'bg-[#ef4444]/10 text-[#ef4444]',
          ]"
        >
          {{ isBalanced ? t.reports.balanced : t.reports.unbalanced }}
        </span>
      </div>
      <label class="flex items-center gap-2 text-xs text-[#6a6a8a] cursor-pointer select-none">
        <input
          v-model="showZeroBalance"
          type="checkbox"
          class="rounded border-[#2a2a4a] bg-[#0a0a0f] text-[#7c5cfc] focus:ring-[#7c5cfc]"
        />
        {{ t.reports.showZero }}
      </label>
    </div>

    <!-- Table -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <!-- Column headers -->
      <div
        class="grid gap-2 px-5 py-3 border-b border-[#2a2a4a]/40 text-xs font-semibold text-[#6a6a8a] uppercase tracking-wider"
        style="grid-template-columns: minmax(0,1fr) 130px 130px 140px"
      >
        <div>{{ t.reports.accountName }}</div>
        <div class="text-right">{{ t.reports.debitBalance }}</div>
        <div class="text-right">{{ t.reports.creditBalance }}</div>
        <div class="text-right">{{ t.common.balance }}</div>
      </div>

      <template v-for="group in groups" :key="group.type">
        <!-- Group label -->
        <div
          class="px-5 py-2 text-xs font-bold uppercase tracking-widest border-b border-[#2a2a4a]/20"
          :style="{ color: group.color, backgroundColor: group.color + '0d' }"
        >
          {{ group.label }}
        </div>

        <!-- Account rows -->
        <div
          v-for="row in group.rows"
          :key="row.id"
          class="grid gap-2 px-5 py-2.5 border-b border-[#2a2a4a]/10 text-sm hover:bg-[#1a1a2e]/30 transition-colors"
          style="grid-template-columns: minmax(0,1fr) 130px 130px 140px"
        >
          <div class="text-[#a0a0c0] truncate pl-2" :title="row.fullPath">{{ row.fullPath }}</div>
          <!-- Debit column: shows net debit balance when positive -->
          <div class="text-right tabular-nums text-[#22c55e]">
            {{ row.debitCol > 0.005 ? formatCurrency(row.debitCol, currency) : '' }}
          </div>
          <!-- Credit column: shows net credit balance when negative -->
          <div class="text-right tabular-nums text-[#ef4444]">
            {{ row.creditCol > 0.005 ? formatCurrency(row.creditCol, currency) : '' }}
          </div>
          <!-- Net balance (raw, for reference) -->
          <div
            :class="[
              'text-right tabular-nums font-medium',
              Math.abs(row.netBalance) < 0.005
                ? 'text-[#6a6a8a]'
                : row.netBalance > 0
                  ? 'text-[#e8e8f0]'
                  : 'text-[#ef4444]',
            ]"
          >
            {{ formatCurrency(row.netBalance, currency) }}
          </div>
        </div>

        <!-- Group subtotal -->
        <div
          class="grid gap-2 px-5 py-2.5 border-b border-[#2a2a4a]/30 text-xs"
          style="grid-template-columns: minmax(0,1fr) 130px 130px 140px"
          :style="{ backgroundColor: group.color + '08' }"
        >
          <div class="text-[#6a6a8a] pl-2">Subtotal — {{ group.label }}</div>
          <div class="text-right tabular-nums font-semibold text-[#22c55e]">
            {{ formatCurrency(group.totalDebitCol, currency) }}
          </div>
          <div class="text-right tabular-nums font-semibold text-[#ef4444]">
            {{ formatCurrency(group.totalCreditCol, currency) }}
          </div>
          <div class="text-right tabular-nums font-semibold" :style="{ color: group.color }">
            {{ formatCurrency(group.totalDebitCol - group.totalCreditCol, currency) }}
          </div>
        </div>
      </template>

      <!-- Grand total -->
      <div
        class="grid gap-2 px-5 py-4 bg-[#1a1a2e]/50 border-t border-[#2a2a4a]/60 text-sm font-bold"
        style="grid-template-columns: minmax(0,1fr) 130px 130px 140px"
      >
        <div class="text-[#e8e8f0] uppercase text-xs tracking-wider">Total Geral</div>
        <div class="text-right tabular-nums text-[#22c55e]">
          {{ formatCurrency(grandDebitCol, currency) }}
        </div>
        <div class="text-right tabular-nums text-[#ef4444]">
          {{ formatCurrency(grandCreditCol, currency) }}
        </div>
        <div :class="['text-right tabular-nums', isBalanced ? 'text-[#22c55e]' : 'text-[#ef4444]']">
          {{ isBalanced ? '—' : formatCurrency(Math.abs(grandDebitCol - grandCreditCol), currency) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useTransactionStore } from '@/stores/transactions'
import { formatCurrency } from '@/utils/accounting'
import { useI18n } from '@/i18n'
import type { AccountType } from '@/types'

const { t } = useI18n()
const accountStore = useAccountStore()
const txStore = useTransactionStore()

defineProps<{ currency: string }>()

const showZeroBalance = ref(false)

const TYPE_ORDER: AccountType[] = ['asset', 'liability', 'equity', 'income', 'expense']
const TYPE_COLORS: Record<AccountType, string> = {
  asset: '#22c55e',
  liability: '#ef4444',
  equity: '#7c5cfc',
  income: '#3b82f6',
  expense: '#f59e0b',
}

const typeLabels = computed<Partial<Record<AccountType, string>>>(() => ({
  asset: t.value.accountTypes.asset,
  liability: t.value.accountTypes.liability,
  equity: t.value.accountTypes.equity,
  income: t.value.accountTypes.income,
  expense: t.value.accountTypes.expense,
}))

// Raw debits/credits per account — no sign adjustment for account type.
// debitCol / creditCol follow the standard trial balance column format:
//   positive net balance → appears in Debit column
//   negative net balance → appears in Credit column (as absolute)
function getTrialBalanceRow(accountId: string) {
  let rawDebits = 0
  let rawCredits = 0
  for (const tx of txStore.transactions) {
    for (const split of tx.splits) {
      if (split.accountId !== accountId) continue
      if (split.amount > 0) rawDebits += split.amount
      else rawCredits += -split.amount
    }
  }
  const netBalance = rawDebits - rawCredits
  return {
    rawDebits,
    rawCredits,
    netBalance,
    debitCol: netBalance > 0 ? netBalance : 0,
    creditCol: netBalance < 0 ? -netBalance : 0,
  }
}

const groups = computed(() => {
  return TYPE_ORDER.map(type => {
    const accs = accountStore.accounts
      .filter(a => a.type === type && a.parentId !== null) // exclude structural roots
      .sort((a, b) =>
        accountStore.getFullPath(a.id, typeLabels.value)
          .localeCompare(accountStore.getFullPath(b.id, typeLabels.value), undefined, { sensitivity: 'base' })
      )

    const rows = accs
      .map(a => ({
        id: a.id,
        fullPath: accountStore.getFullPath(a.id, typeLabels.value),
        ...getTrialBalanceRow(a.id),
      }))
      .filter(r => showZeroBalance.value || Math.abs(r.netBalance) > 0.005)

    const totalDebitCol = rows.reduce((s, r) => s + r.debitCol, 0)
    const totalCreditCol = rows.reduce((s, r) => s + r.creditCol, 0)

    return {
      type,
      label: typeLabels.value[type] ?? type,
      color: TYPE_COLORS[type],
      rows,
      totalDebitCol,
      totalCreditCol,
    }
  }).filter(g => g.rows.length > 0)
})

const grandDebitCol = computed(() => groups.value.reduce((s, g) => s + g.totalDebitCol, 0))
const grandCreditCol = computed(() => groups.value.reduce((s, g) => s + g.totalCreditCol, 0))
const isBalanced = computed(() => Math.abs(grandDebitCol.value - grandCreditCol.value) < 0.01)
</script>
