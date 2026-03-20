<template>
  <div>
    <!-- Account row -->
    <div
      :class="[
        'flex items-center px-3 md:px-6 py-3 group transition-all duration-200 hover:bg-[#1a1a2e]/50 cursor-pointer',
      ]"
      @click="handleClick"
      @contextmenu.prevent="openContextMenu"
    >
      <div class="flex items-center gap-3 min-w-0 flex-1" :style="{ paddingLeft: `${depth * 24}px` }">
        <!-- Expand arrow -->
        <div class="w-5 flex items-center justify-center shrink-0" @click.stop="toggleExpand">
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
          class="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-125 shrink-0"
          :style="{ backgroundColor: typeColor }"
        ></div>

        <!-- Account info -->
        <div class="min-w-0">
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

      <div class="flex items-center gap-4 shrink-0 ml-4">
        <!-- Currency badge -->
        <span
          v-if="!props.account.placeholder && props.account.currency !== defaultCurrency"
          class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7c5cfc]/15 text-[#7c5cfc]"
        >
          {{ props.account.currency }}
        </span>
        <!-- Balance -->
        <span :class="[
          'text-xs md:text-sm font-semibold tabular-nums text-right w-24 md:w-32',
          balance >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
        ]">
          {{ formatCurrency(balance, defaultCurrency) }}
        </span>

        <!-- Actions -->
        <div class="w-7 flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          :force-expanded="props.forceExpanded"
          :expand-generation="props.expandGeneration"
          @open-ledger="(acc: Account) => emit('open-ledger', acc)"
          @create-subaccount="(acc: Account) => emit('create-subaccount', acc)"
          @edit-account="(acc: Account) => emit('edit-account', acc)"
        />
      </div>
    </transition>

    <!-- Context menu (teleported to body so it overlays everything) -->
    <Teleport to="body">
      <template v-if="menuVisible">
        <!-- Backdrop: captures outside clicks to close -->
        <div
          class="fixed inset-0 z-[990]"
          @click="closeMenu"
          @contextmenu.prevent="closeMenu"
        ></div>

        <!-- Menu -->
        <div
          class="fixed z-[991] bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-2xl shadow-black/60 py-1 min-w-[175px]"
          :style="menuStyle"
        >
          <!-- Create sub-account -->
          <button
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#a0a0c0] hover:text-[#e8e8f0] hover:bg-[#7c5cfc]/10 transition-colors text-left"
            @click="handleCreateSubaccount"
          >
            <FolderPlus class="w-4 h-4 shrink-0" />
            {{ t.accounts.newSubAccount }}
          </button>

          <!-- Edit -->
          <button
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#a0a0c0] hover:text-[#e8e8f0] hover:bg-[#7c5cfc]/10 transition-colors text-left"
            @click="handleEdit"
          >
            <Pencil class="w-4 h-4 shrink-0" />
            {{ t.accounts.editAccount }}
          </button>

          <!-- Divider + Delete (only when deletable) -->
          <template v-if="canDelete">
            <div class="h-px bg-[#2a2a4a] mx-2 my-1"></div>
            <button
              class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors text-left"
              @click="handleDeleteFromMenu"
            >
              <Trash2 class="w-4 h-4 shrink-0" />
              {{ t.common.delete }}
            </button>
          </template>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { useUIStore } from '@/stores/ui'
import { formatCurrency } from '@/utils/accounting'
import { ACCOUNT_TYPE_COLORS } from '@/types'
import type { Account, AccountType } from '@/types'
import { ChevronRight, Trash2, FolderPlus, Pencil } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

// Module-level shared state: only one context menu visible at a time
const ctxMenu = reactive({ id: null as string | null, x: 0, y: 0 })

const props = defineProps<{
  account: Account
  depth: number
  forceExpanded?: boolean
  expandGeneration?: number
}>()

const emit = defineEmits<{
  'open-ledger': [account: Account]
  'create-subaccount': [account: Account]
  'edit-account': [account: Account]
}>()

const accountStore = useAccountStore()
const { defaultCurrency } = useUIStore()
const expanded = ref(false)

watch(() => props.expandGeneration, () => {
  expanded.value = !!props.forceExpanded
}, { immediate: true })

const children = computed(() =>
  [...accountStore.getChildren(props.account.id)].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
)
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

function toggleExpand() {
  if (hasChildren.value) {
    expanded.value = !expanded.value
  }
}

function handleClick() {
  if (!props.account.placeholder) {
    emit('open-ledger', props.account)
  } else if (hasChildren.value) {
    expanded.value = !expanded.value
  }
}

// ── Context menu ────────────────────────────────────────────────────
const menuVisible = computed(() => ctxMenu.id === props.account.id)

const menuStyle = computed(() => {
  const menuW = 180
  const menuH = canDelete.value ? 128 : 90
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const left = ctxMenu.x + menuW > vw ? ctxMenu.x - menuW : ctxMenu.x
  const top  = ctxMenu.y + menuH > vh ? ctxMenu.y - menuH : ctxMenu.y
  return { left: left + 'px', top: top + 'px' }
})

function openContextMenu(event: MouseEvent) {
  ctxMenu.id = props.account.id
  ctxMenu.x = event.clientX
  ctxMenu.y = event.clientY
}

function closeMenu() {
  ctxMenu.id = null
}

function handleCreateSubaccount() {
  closeMenu()
  emit('create-subaccount', props.account)
}

function handleEdit() {
  closeMenu()
  emit('edit-account', props.account)
}

function handleDeleteFromMenu() {
  closeMenu()
  if (confirm(t.value.accounts.confirmDelete.replace('{name}', displayName.value))) {
    accountStore.deleteAccount(props.account.id)
  }
}

function handleDelete() {
  if (confirm(t.value.accounts.confirmDelete.replace('{name}', displayName.value))) {
    accountStore.deleteAccount(props.account.id)
  }
}
</script>
