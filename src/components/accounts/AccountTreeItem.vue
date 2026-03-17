<template>
  <div>
    <!-- Account row -->
    <div
      :class="[
        'flex items-center justify-between px-6 py-3 group transition-all duration-200 hover:bg-[#1a1a2e]/50 cursor-pointer',
      ]"
      :style="{ paddingLeft: `${depth * 24 + 24}px` }"
      @click="handleClick"
    >
      <div class="flex items-center gap-3">
        <!-- Expand arrow -->
        <div class="w-5 flex items-center justify-center">
          <ChevronRight
            v-if="hasChildren"
            :class="[
              'w-4 h-4 text-[#6a6a8a] transition-transform duration-200',
              expanded ? 'rotate-90' : ''
            ]"
          />
        </div>

        <!-- Type indicator -->
        <div
          class="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-125"
          :style="{ backgroundColor: typeColor }"
        ></div>

        <!-- Account info -->
        <div>
          <span :class="[
            'text-sm font-medium transition-colors duration-200',
            account.placeholder ? 'text-[#a0a0c0]' : 'text-[#e8e8f0]'
          ]">
            {{ displayName }}
          </span>
          <span v-if="account.placeholder" class="ml-2 text-xs text-[#6a6a8a] bg-[#1a1a2e] px-1.5 py-0.5 rounded">
            {{ t.common.group }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Currency badge -->
        <span
          v-if="!props.account.placeholder && props.account.currency !== defaultCurrency"
          class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7c5cfc]/15 text-[#7c5cfc]"
        >
          {{ props.account.currency }}
        </span>
        <!-- Balance -->
        <span :class="[
          'text-sm font-semibold tabular-nums',
          balance >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
        ]">
          {{ formatCurrency(balance, defaultCurrency) }}
        </span>

        <!-- Actions -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            v-if="canDelete"
            @click.stop="handleDelete"
            class="p-1 rounded-lg text-[#6a6a8a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Children -->
    <transition name="slide">
      <div v-if="expanded && hasChildren">
        <AccountTreeItem
          v-for="child in children"
          :key="child.id"
          :account="child"
          :depth="depth + 1"
          @open-ledger="(acc: Account) => emit('open-ledger', acc)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useUIStore } from '@/stores/ui'
import { formatCurrency } from '@/utils/accounting'
import { ACCOUNT_TYPE_COLORS } from '@/types'
import type { Account, AccountType } from '@/types'
import { ChevronRight, Trash2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{
  account: Account
  depth: number
}>()

const emit = defineEmits<{
  'open-ledger': [account: Account]
}>()

const accountStore = useAccountStore()
const { defaultCurrency } = useUIStore()
const expanded = ref(props.depth < 2) // Auto-expand root + second level

const children = computed(() => accountStore.getChildren(props.account.id))
const hasChildren = computed(() => children.value.length > 0)
const balance = computed(() => accountStore.getAccountBalance(props.account.id))
const typeColor = computed(() => ACCOUNT_TYPE_COLORS[props.account.type])
const canDelete = computed(() => !hasChildren.value && props.account.parentId !== null)
const typeLabels = computed<Partial<Record<AccountType, string>>>(() => ({
  asset: t.value.accountTypes.asset,
  liability: t.value.accountTypes.liability,
  equity: t.value.accountTypes.equity,
  income: t.value.accountTypes.income,
  expense: t.value.accountTypes.expense,
}))
const displayName = computed(() => accountStore.getDisplayName(props.account, typeLabels.value))

function handleClick() {
  if (hasChildren.value) {
    expanded.value = !expanded.value
  }
  if (!props.account.placeholder) {
    emit('open-ledger', props.account)
  }
}

function handleDelete() {
  if (confirm(t.value.accounts.confirmDelete.replace('{name}', displayName.value))) {
    accountStore.deleteAccount(props.account.id)
  }
}
</script>
