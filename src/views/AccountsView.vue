<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[#e8e8f0]">{{ t.accounts.title }}</h1>
        <p class="text-sm text-[#6a6a8a] mt-0.5">{{ t.accounts.subtitle }}</p>
      </div>
      <button
        @click="showAddModal = true"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
               bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] text-white
               hover:shadow-lg hover:shadow-[#7c5cfc]/30 hover:scale-[1.02]
               active:scale-[0.98] transition-all duration-200"
      >
        <Plus class="w-4 h-4" />
        {{ t.accounts.newAccount }}
      </button>
    </div>

    <!-- Account Types Tabs -->
    <div class="flex gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
          activeTab === tab.value
            ? 'bg-[#7c5cfc]/15 text-[#7c5cfc] shadow-sm shadow-[#7c5cfc]/10'
            : 'text-[#6a6a8a] hover:text-[#a0a0c0] hover:bg-[#1a1a2e]'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Account Tree -->
    <div class="bg-[#12121a] border border-[#2a2a4a]/60 rounded-2xl overflow-hidden">
      <div class="divide-y divide-[#2a2a4a]/30">
        <AccountTreeItem
          v-for="acc in filteredRoots"
          :key="acc.id"
          :account="acc"
          :depth="0"
          @open-ledger="openLedger"
        />
      </div>
    </div>

    <!-- Add Account Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showAddModal = false"></div>
          <div class="relative w-full max-w-lg bg-[#12121a] border border-[#2a2a4a] rounded-2xl shadow-2xl">
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]/60">
              <h2 class="text-lg font-semibold text-[#e8e8f0]">{{ t.accounts.newAccount }}</h2>
              <button @click="showAddModal = false" class="p-1.5 rounded-lg text-[#6a6a8a] hover:text-[#e8e8f0] hover:bg-[#1a1a2e] transition-all">
                <X class="w-5 h-5" />
              </button>
            </div>
            <form @submit.prevent="handleAddAccount" class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-medium text-[#a0a0c0] mb-1.5">{{ t.accounts.name }}</label>
                <input v-model="newAccount.name" type="text" required
                  class="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
                         focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/30 transition-all" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-[#a0a0c0] mb-1.5">{{ t.accounts.type }}</label>
                  <select v-model="newAccount.type"
                    class="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
                           focus:outline-none focus:border-[#7c5cfc]/50 transition-all appearance-none">
                    <option value="asset">{{ t.accountTypesSingular.asset }}</option>
                    <option value="liability">{{ t.accountTypesSingular.liability }}</option>
                    <option value="equity">{{ t.accountTypesSingular.equity }}</option>
                    <option value="income">{{ t.accountTypesSingular.income }}</option>
                    <option value="expense">{{ t.accountTypesSingular.expense }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-[#a0a0c0] mb-1.5">{{ t.accounts.parentAccount }}</label>
                  <select v-model="newAccount.parentId"
                    class="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
                           focus:outline-none focus:border-[#7c5cfc]/50 transition-all appearance-none">
                    <option v-for="acc in parentOptions" :key="acc.id" :value="acc.id">
                      {{ accountStore.getFullPath(acc.id) }}
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-[#a0a0c0] mb-1.5">{{ t.common.description }}</label>
                <input v-model="newAccount.description" type="text"
                  class="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
                         focus:outline-none focus:border-[#7c5cfc]/50 transition-all" />
              </div>
              <div>
                <label class="block text-xs font-medium text-[#a0a0c0] mb-1.5">{{ t.accounts.currency }}</label>
                <select v-model="newAccount.currency"
                  class="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
                         focus:outline-none focus:border-[#7c5cfc]/50 transition-all appearance-none">
                  <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
                  {{ c.symbol }} {{ c.code }} — {{ (t.currencies as any)[c.code] || c.name }}
                  </option>
                </select>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 text-sm text-[#a0a0c0] cursor-pointer">
                  <input v-model="newAccount.placeholder" type="checkbox" class="rounded border-[#2a2a4a] bg-[#0a0a0f] text-[#7c5cfc] focus:ring-[#7c5cfc]" />
                  {{ t.accounts.groupAccount }}
                </label>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" @click="showAddModal = false"
                  class="px-4 py-2 rounded-xl text-sm text-[#a0a0c0] hover:text-[#e8e8f0] hover:bg-[#1a1a2e] transition-all">
                  {{ t.common.cancel }}
                </button>
                <button type="submit"
                  class="px-6 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] text-white
                         hover:shadow-lg hover:shadow-[#7c5cfc]/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {{ t.accounts.createAccount }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>
    <!-- Account Ledger Modal -->
    <AccountLedger :account="ledgerAccount" @close="ledgerAccount = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/i18n'
import type { Account, AccountType } from '@/types'
import { Plus, X } from 'lucide-vue-next'
import AccountTreeItem from '@/components/accounts/AccountTreeItem.vue'
import AccountLedger from '@/components/accounts/AccountLedger.vue'
import { CURRENCIES } from '@/utils/currency'

const accountStore = useAccountStore()
const ui = useUIStore()
const { t } = useI18n()

const activeTab = ref<AccountType | 'all'>('all')
const showAddModal = ref(false)
const ledgerAccount = ref<Account | null>(null)

function openLedger(account: Account) {
  ledgerAccount.value = account
}

const tabs = computed<{ value: AccountType | 'all'; label: string }[]>(() => [
  { value: 'all', label: t.value.common.all },
  { value: 'asset', label: t.value.accountTypes.asset },
  { value: 'liability', label: t.value.accountTypes.liability },
  { value: 'equity', label: t.value.accountTypes.equity },
  { value: 'income', label: t.value.accountTypes.income },
  { value: 'expense', label: t.value.accountTypes.expense },
])

const filteredRoots = computed(() => {
  if (activeTab.value === 'all') return accountStore.rootAccounts
  return accountStore.rootAccounts.filter(a => a.type === activeTab.value)
})

const parentOptions = computed(() =>
  accountStore.accounts.filter(a =>
    a.type === newAccount.value.type
  )
)

const newAccount = ref({
  name: '',
  type: 'expense' as AccountType,
  parentId: 'root-expense',
  description: '',
  placeholder: false,
  currency: ui.defaultCurrency,
})

function handleAddAccount() {
  accountStore.addAccount({
    name: newAccount.value.name,
    type: newAccount.value.type,
    parentId: newAccount.value.parentId,
    description: newAccount.value.description,
    currency: newAccount.value.currency,
    placeholder: newAccount.value.placeholder,
    hidden: false,
  })
  showAddModal.value = false
  newAccount.value = { name: '', type: 'expense', parentId: 'root-expense', description: '', placeholder: false, currency: ui.defaultCurrency }
}
</script>
