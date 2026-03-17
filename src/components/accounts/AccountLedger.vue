<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="account" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

        <!-- Modal -->
        <div :class="[
          'relative flex flex-col bg-[#12121a] border border-[#2a2a4a] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 w-full',
          isTransactionModalOpen ? 'max-w-5xl max-h-[40vh] mb-auto mt-4' : 'max-w-5xl max-h-[85vh]'
        ]">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]/60 shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: typeColor }"></div>
              <div class="min-w-0">
                <h2 class="text-lg font-semibold text-[#e8e8f0] truncate">{{ accountDisplayName }}</h2>
                <p class="text-xs text-[#6a6a8a]">{{ fullPath }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4 shrink-0 ml-4">
              <div class="text-right">
                <p class="text-xs text-[#6a6a8a]">{{ t.common.balance }}</p>
                <p :class="['text-lg font-bold tabular-nums', balance >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]']">
                  {{ formatCurrency(balance, ui.defaultCurrency) }}
                </p>
              </div>
              <button
                @click="createTransaction"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                       bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] text-white
                       hover:shadow-lg hover:shadow-[#7c5cfc]/30 hover:scale-[1.02]
                       active:scale-[0.98] transition-all duration-200"
              >
                <Plus class="w-3.5 h-3.5" />
                {{ t.tx.newTransaction }}
              </button>
              <button
                @click="$emit('close')"
                class="p-1.5 rounded-lg text-[#6a6a8a] hover:text-[#e8e8f0] hover:bg-[#1a1a2e] transition-all duration-200"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Table Header -->
          <div class="grid gap-2 px-6 py-2.5 border-b border-[#2a2a4a]/40 text-xs font-semibold text-[#6a6a8a] uppercase tracking-wider shrink-0" style="grid-template-columns: 90px 1fr 1fr 110px 110px 110px">
            <div>{{ t.common.date }}</div>
            <div>{{ t.common.description }}</div>
            <div>{{ t.accounts.counterparty }}</div>
            <div class="text-right">{{ t.common.debit }}</div>
            <div class="text-right">{{ t.common.credit }}</div>
            <div class="text-right">{{ t.common.balance }}</div>
          </div>

          <!-- Rows -->
          <div class="flex-1 overflow-y-auto">
            <div
              v-for="(row, idx) in ledgerRows"
              :key="row.tx.id"
              class="grid gap-2 px-6 py-3 text-sm border-b border-[#2a2a4a]/15 hover:bg-[#1a1a2e]/50 transition-colors duration-150 cursor-pointer group"
              style="grid-template-columns: 90px 1fr 1fr 110px 110px 110px"
              @click="editTransaction(row.tx.id)"
            >
              <div class="text-[#a0a0c0]">{{ formatDate(row.tx.date) }}</div>
              <div class="text-[#e8e8f0] font-medium truncate">
                {{ row.tx.description }}
                <div v-if="row.originalCurrency" class="text-[10px] text-[#7c5cfc]/60">
                  {{ getRowRate(row) }}
                </div>
              </div>
              <div class="flex items-center gap-1.5 min-w-0">
                <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: row.counterColor }"></div>
                <span class="text-[#a0a0c0] truncate">{{ row.counterName }}</span>
              </div>
              <div class="text-right tabular-nums">
                <span v-if="row.debit > 0" class="text-[#22c55e]">{{ formatCurrency(row.debit, ui.defaultCurrency) }}</span>
                <div v-if="row.originalDebit > 0" class="text-[10px] text-[#7c5cfc]/70">
                  {{ formatCurrency(row.originalDebit, row.originalCurrency) }}
                </div>
              </div>
              <div class="text-right tabular-nums">
                <span v-if="row.credit > 0" class="text-[#ef4444]">{{ formatCurrency(row.credit, ui.defaultCurrency) }}</span>
                <div v-if="row.originalCredit > 0" class="text-[10px] text-[#7c5cfc]/70">
                  {{ formatCurrency(row.originalCredit, row.originalCurrency) }}
                </div>
              </div>
              <div class="text-right tabular-nums">
                <span :class="[row.runningBalance >= 0 ? 'text-[#e8e8f0]' : 'text-[#ef4444]']">
                  {{ formatCurrency(row.runningBalance, ui.defaultCurrency) }}
                </span>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="ledgerRows.length === 0" class="px-6 py-16 text-center">
              <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#1a1a2e] flex items-center justify-center">
                <BookOpen class="w-7 h-7 text-[#6a6a8a]" />
              </div>
              <p class="text-[#6a6a8a] text-sm">{{ t.accounts.noMovements }}</p>
            </div>
          </div>

          <!-- Footer summary -->
          <div v-if="ledgerRows.length > 0" class="grid gap-2 px-6 py-3 border-t border-[#2a2a4a]/60 text-xs font-semibold shrink-0 bg-[#0d0d15]/50" style="grid-template-columns: 90px 1fr 1fr 110px 110px 110px">
            <div class="text-[#6a6a8a]">{{ ledgerRows.length }} {{ t.common.movements }}</div>
            <div></div>
            <div class="text-right text-[#6a6a8a]">{{ t.common.total }}</div>
            <div class="text-right tabular-nums text-[#22c55e]">{{ formatCurrency(totalDebits, ui.defaultCurrency) }}</div>
            <div class="text-right tabular-nums text-[#ef4444]">{{ formatCurrency(totalCredits, ui.defaultCurrency) }}</div>
            <div class="text-right tabular-nums" :class="balance >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'">
              {{ formatCurrency(balance, ui.defaultCurrency) }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useTransactionStore } from '@/stores/transactions'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatDate } from '@/utils/accounting'
import { ACCOUNT_TYPE_COLORS, isDebitPositive } from '@/types'
import type { Account, AccountType, Transaction } from '@/types'
import { X, BookOpen, Plus } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{
  account: Account | null
}>()

const emit = defineEmits<{
  close: []
}>()

const accountStore = useAccountStore()
const txStore = useTransactionStore()
const ui = useUIStore()

const isTransactionModalOpen = computed(() => ui.transactionModalOpen && !!ui.prefillDestinationAccountId)

const acctCurrency = computed(() => props.account?.currency ?? 'BRL')
const typeColor = computed(() => props.account ? ACCOUNT_TYPE_COLORS[props.account.type] : '#6a6a8a')
const typeLabels = computed<Partial<Record<AccountType, string>>>(() => ({
  asset: t.value.accountTypes.asset,
  liability: t.value.accountTypes.liability,
  equity: t.value.accountTypes.equity,
  income: t.value.accountTypes.income,
  expense: t.value.accountTypes.expense,
}))
const accountDisplayName = computed(() =>
  props.account ? accountStore.getDisplayName(props.account, typeLabels.value) : ''
)
const fullPath = computed(() =>
  props.account ? accountStore.getFullPath(props.account.id, typeLabels.value) : ''
)
const balance = computed(() => props.account ? accountStore.getAccountBalance(props.account.id) : 0)

interface LedgerRow {
  tx: Transaction
  debit: number
  credit: number
  originalDebit: number
  originalCredit: number
  originalCurrency: string
  counterName: string
  counterColor: string
  runningBalance: number
}

const ledgerRows = computed<LedgerRow[]>(() => {
  if (!props.account) return []

  const transactions = txStore.getTransactionsForAccount(props.account.id)
  // Sort oldest first for running balance
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))

  let running = 0
  const debitPositive = isDebitPositive(props.account.type)

  return sorted.map(tx => {
    const mySplit = tx.splits.find(s => s.accountId === props.account!.id)!
    const counterSplits = tx.splits.filter(s => s.accountId !== props.account!.id)

    // Counter-party account name
    let counterName = t.value.common.multipleAccounts
    let counterColor = '#6a6a8a'
    if (counterSplits.length === 1) {
      const counterAcc = accountStore.getAccount(counterSplits[0].accountId)
      counterName = counterAcc ? accountStore.getDisplayName(counterAcc, typeLabels.value) : t.value.common.unknown
      counterColor = counterAcc ? ACCOUNT_TYPE_COLORS[counterAcc.type] : '#6a6a8a'
    } else if (counterSplits.length > 1) {
      const names = counterSplits.map(s => {
        const account = accountStore.getAccount(s.accountId)
        return account ? accountStore.getDisplayName(account, typeLabels.value) : '?'
      })
      counterName = names.join(', ')
    }

    const debit = mySplit.amount > 0 ? mySplit.amount : 0
    const credit = mySplit.amount < 0 ? -mySplit.amount : 0

    const origAmt = mySplit.originalAmount
    const origDebit = origAmt != null && origAmt > 0 ? origAmt : 0
    const origCredit = origAmt != null && origAmt < 0 ? -origAmt : 0

    // Running balance respects the natural sign of the account type
    if (debitPositive) {
      running += mySplit.amount
    } else {
      running -= mySplit.amount
    }

    return {
      tx,
      debit,
      credit,
      originalDebit: origDebit,
      originalCredit: origCredit,
      originalCurrency: mySplit.originalCurrency ?? '',
      counterName,
      counterColor,
      runningBalance: running,
    }
  })
})

const totalDebits = computed(() => ledgerRows.value.reduce((sum, r) => sum + r.debit, 0))
const totalCredits = computed(() => ledgerRows.value.reduce((sum, r) => sum + r.credit, 0))

const isForeignAccount = computed(() => acctCurrency.value !== ui.defaultCurrency)

function getRowRate(row: LedgerRow): string {
  const projectAmt = row.debit || row.credit
  const origAmt = row.originalDebit || row.originalCredit
  if (!projectAmt || !origAmt) return ''
  const rate = (origAmt / projectAmt).toFixed(4)
  return `1 ${ui.defaultCurrency} = ${rate} ${row.originalCurrency}`
}

function editTransaction(txId: string) {
  emit('close')
  ui.openTransactionModal(txId)
}

function createTransaction() {
  ui.openTransactionModal(undefined, props.account?.id)
}
</script>
