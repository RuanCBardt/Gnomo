<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-[#e8e8f0]">{{ t.tx.title }}</h1>
        <p class="text-xs md:text-sm text-[#6a6a8a] mt-0.5">{{ t.tx.subtitle }}</p>
      </div>
      <button
        @click="ui.openTransactionModal()"
        class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
               bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] text-white
               hover:shadow-lg hover:shadow-[#7c5cfc]/30 hover:scale-[1.02]
               active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
      >
        <Plus class="w-4 h-4" />
        {{ t.tx.newTransaction }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
      <div class="relative w-full md:w-auto">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6a8a]" />
        <input
          v-model="search"
          type="text"
          :placeholder="t.tx.filterPlaceholder"
          class="pl-10 pr-4 py-2 rounded-xl bg-[#12121a] border border-[#2a2a4a]/60 text-sm text-[#e8e8f0] placeholder:text-[#6a6a8a]
                 focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/30 transition-all w-full md:w-64"
        />
      </div>

      <select
        v-model="filterAccount"
        class="px-3 py-2 rounded-xl bg-[#12121a] border border-[#2a2a4a]/60 text-sm text-[#e8e8f0]
               focus:outline-none focus:border-[#7c5cfc]/50 transition-all appearance-none w-full md:w-auto"
      >
        <option value="">{{ t.tx.allAccounts }}</option>
        <optgroup v-for="type in accountTypes" :key="type.value" :label="type.label">
          <option v-for="acc in accountStore.getAccountsByType(type.value)" :key="acc.id" :value="acc.id">
            {{ acc.name }}
          </option>
        </optgroup>
      </select>

      <div class="flex items-center gap-2">
        <input
          v-model="dateFrom"
          type="date"
          class="flex-1 md:flex-none px-3 py-2 rounded-xl bg-[#12121a] border border-[#2a2a4a]/60 text-sm text-[#e8e8f0]
                 focus:outline-none focus:border-[#7c5cfc]/50 transition-all"
        />
        <span class="text-[#6a6a8a] text-xs">{{ t.common.to }}</span>
        <input
          v-model="dateTo"
          type="date"
          class="flex-1 md:flex-none px-3 py-2 rounded-xl bg-[#12121a] border border-[#2a2a4a]/60 text-sm text-[#e8e8f0]
                 focus:outline-none focus:border-[#7c5cfc]/50 transition-all"
        />
      </div>

      <div class="md:ml-auto text-xs text-[#6a6a8a]">
        {{ filteredTransactions.length }} {{ t.common.transactions }}
      </div>
    </div>

    <!-- Table -->
    <!-- Mobile Card Layout -->
    <div class="md:hidden space-y-2">
      <div
        v-for="tx in filteredTransactions"
        :key="'m-' + tx.id"
        class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-xl p-4 active:bg-[#1a1a2e]/60 transition-colors duration-150"
        @click="ui.openTransactionModal(tx.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-[#e8e8f0] truncate">{{ tx.description }}</p>
            <p class="text-xs text-[#6a6a8a] mt-0.5">{{ formatDate(tx.date) }}</p>
            <div class="flex flex-wrap gap-1.5 mt-1.5">
              <span
                v-for="split in tx.splits"
                :key="split.id"
                class="inline-flex items-center gap-1 text-[10px] text-[#a0a0c0]"
              >
                <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getAccountColor(split.accountId) }"></div>
                {{ getAccountName(split.accountId) }}
              </span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p v-if="tx.splits[0]" :class="['text-sm font-semibold tabular-nums', tx.splits[0].amount > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]']">
              {{ formatCurrency(Math.abs(tx.splits[0].amount), getAccountCurrency(tx.splits[0].accountId)) }}
            </p>
            <CheckCircle2 v-if="tx.reconciled" class="w-3.5 h-3.5 text-[#22c55e] mt-1 ml-auto" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredTransactions.length === 0" class="py-16 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1a1a2e] flex items-center justify-center">
          <ArrowLeftRight class="w-8 h-8 text-[#6a6a8a]" />
        </div>
        <p class="text-[#6a6a8a]">{{ t.tx.noTransactions }}</p>
        <button
          @click="ui.openTransactionModal()"
          class="mt-3 text-sm text-[#7c5cfc] hover:text-[#5c8cfc] transition-colors"
        >
          {{ t.tx.createFirst }}
        </button>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="hidden md:block bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <!-- Table Header -->
      <div class="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#2a2a4a]/40 text-xs font-semibold text-[#6a6a8a] uppercase tracking-wider">
        <div class="col-span-2">{{ t.common.date }}</div>
        <div class="col-span-3">{{ t.common.description }}</div>
        <div class="col-span-3">{{ t.tx.account }}</div>
        <div class="col-span-1 text-right">{{ t.common.debit }}</div>
        <div class="col-span-1 text-right">{{ t.common.credit }}</div>
        <div class="col-span-1 text-center">{{ t.tx.status }}</div>
        <div class="col-span-1"></div>
      </div>

      <!-- Transaction rows -->
      <div class="divide-y divide-[#2a2a4a]/20 max-h-[calc(100vh-380px)] overflow-y-auto">
        <template v-for="tx in filteredTransactions" :key="tx.id">
          <div
            v-for="(split, idx) in tx.splits"
            :key="split.id"
            :class="[
              'grid grid-cols-12 gap-4 px-6 py-3 text-sm transition-all duration-200',
              'hover:bg-[#1a1a2e]/50 group cursor-pointer',
              idx > 0 ? 'bg-[#0f0f18]/30' : ''
            ]"
            @click="ui.openTransactionModal(tx.id)"
          >
            <div class="col-span-2">
              <span v-if="idx === 0" class="text-[#a0a0c0]">{{ formatDate(tx.date) }}</span>
            </div>
            <div class="col-span-3">
              <span v-if="idx === 0" class="text-[#e8e8f0] font-medium">{{ tx.description }}</span>
            </div>
            <div class="col-span-3 flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getAccountColor(split.accountId) }"></div>
              <span class="text-[#a0a0c0] truncate">{{ getAccountName(split.accountId) }}</span>
            </div>
            <div class="col-span-1 text-right tabular-nums">
              <span v-if="split.amount > 0" class="text-[#22c55e]">{{ formatCurrency(split.amount, getAccountCurrency(split.accountId)) }}</span>
            </div>
            <div class="col-span-1 text-right tabular-nums">
              <span v-if="split.amount < 0" class="text-[#ef4444]">{{ formatCurrency(-split.amount, getAccountCurrency(split.accountId)) }}</span>
            </div>
            <div class="col-span-1 flex justify-center">
              <span v-if="idx === 0">
                <CheckCircle2 v-if="tx.reconciled" class="w-4 h-4 text-[#22c55e]" />
                <Circle v-else class="w-4 h-4 text-[#6a6a8a]" />
              </span>
            </div>
            <div class="col-span-1 flex justify-end">
              <button
                v-if="idx === 0"
                @click.stop="handleDelete(tx.id)"
                class="p-1 rounded-lg text-[#6a6a8a] opacity-0 group-hover:opacity-100
                       hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>

        <!-- Empty state -->
        <div v-if="filteredTransactions.length === 0" class="px-6 py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1a1a2e] flex items-center justify-center">
            <ArrowLeftRight class="w-8 h-8 text-[#6a6a8a]" />
          </div>
          <p class="text-[#6a6a8a]">{{ t.tx.noTransactions }}</p>
          <button
            @click="ui.openTransactionModal()"
            class="mt-3 text-sm text-[#7c5cfc] hover:text-[#5c8cfc] transition-colors"
          >
            {{ t.tx.createFirst }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useTransactionStore } from '@/stores/transactions'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatDate } from '@/utils/accounting'
import { ACCOUNT_TYPE_COLORS } from '@/types'
import type { AccountType } from '@/types'
import { useI18n } from '@/i18n'
import {
  Plus,
  Search,
  Trash2,
  ArrowLeftRight,
  CheckCircle2,
  Circle,
} from 'lucide-vue-next'

const accountStore = useAccountStore()
const txStore = useTransactionStore()
const ui = useUIStore()
const { t } = useI18n()

const search = ref('')
const filterAccount = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const accountTypes = computed<{ value: AccountType; label: string }[]>(() => [
  { value: 'asset', label: t.value.accountTypes.asset },
  { value: 'liability', label: t.value.accountTypes.liability },
  { value: 'equity', label: t.value.accountTypes.equity },
  { value: 'income', label: t.value.accountTypes.income },
  { value: 'expense', label: t.value.accountTypes.expense },
])

const filteredTransactions = computed(() => {
  let result = txStore.sortedTransactions

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(tx =>
      tx.description.toLowerCase().includes(q) ||
      tx.splits.some(s => {
        const acc = accountStore.getAccount(s.accountId)
        return acc?.name.toLowerCase().includes(q)
      })
    )
  }

  if (filterAccount.value) {
    result = result.filter(tx =>
      tx.splits.some(s => s.accountId === filterAccount.value)
    )
  }

  if (dateFrom.value) {
    result = result.filter(tx => tx.date >= dateFrom.value)
  }
  if (dateTo.value) {
    result = result.filter(tx => tx.date <= dateTo.value)
  }

  return result
})

function getAccountName(id: string): string {
  return accountStore.getAccount(id)?.name ?? t.value.common.unknown
}

function getAccountCurrency(id: string): string {
  return accountStore.getAccount(id)?.currency ?? 'BRL'
}

function getAccountColor(id: string): string {
  const acc = accountStore.getAccount(id)
  return acc ? ACCOUNT_TYPE_COLORS[acc.type] : '#6a6a8a'
}

function handleDelete(id: string) {
  if (confirm(t.value.tx.confirmDelete)) {
    txStore.deleteTransaction(id)
  }
}
</script>
