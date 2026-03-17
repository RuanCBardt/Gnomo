<template>
  <div class="relative" ref="containerRef">
    <input
      ref="inputRef"
      :value="searchText"
      @input="onInput"
      @focus="open = true"
      @keydown.down.prevent="moveHighlight(1)"
      @keydown.up.prevent="moveHighlight(-1)"
      @keydown.enter.prevent="confirmHighlighted"
      @keydown.escape="open = false"
      @keydown.tab="open = false"
      type="text"
      :placeholder="placeholder"
      autocomplete="off"
      class="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
             focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/30
             transition-all duration-200 placeholder:text-[#6a6a8a]"
    />

    <!-- Dropdown (fixed position to escape overflow) -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="open && filtered.length > 0"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed z-[100] max-h-72 min-w-[320px] overflow-y-auto rounded-xl bg-[#12121a] border border-[#2a2a4a] shadow-2xl shadow-black/60"
        >
          <template v-for="group in groupedFiltered" :key="group.label">
            <div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6a6a8a] bg-[#0d0d15]/80 sticky top-0 z-10">
              {{ group.label }}
            </div>
            <button
              v-for="opt in group.items"
              :key="opt.id"
              type="button"
              @mousedown.prevent="select(opt.id)"
              :class="[
                'w-full text-left px-3 py-2.5 text-sm transition-colors duration-100 flex items-center gap-2',
                opt.id === highlightedId
                  ? 'bg-[#7c5cfc]/15 text-[#e8e8f0]'
                  : 'text-[#a0a0c0] hover:bg-[#1a1a2e]/60 hover:text-[#e8e8f0]'
              ]"
            >
              <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: ACCOUNT_TYPE_COLORS[opt.type] }"></div>
              <span class="whitespace-nowrap">{{ accountStore.getFullPath(opt.id) }}</span>
            </button>
          </template>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAccountStore } from '@/stores/accounts'
import { ACCOUNT_TYPE_COLORS } from '@/types'
import type { Account, AccountType } from '@/types'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const accountStore = useAccountStore()
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)

const open = ref(false)
const query = ref('')
const highlightedId = ref('')

const dropdownStyle = ref<Record<string, string>>({})

function updateDropdownPosition() {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const openAbove = spaceBelow < 300 && rect.top > spaceBelow

  dropdownStyle.value = {
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 320)}px`,
    ...(openAbove
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }
    ),
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(updateDropdownPosition)
    query.value = ''
    highlightedId.value = filtered.value[0]?.id ?? ''
  }
})

const typeLabels = computed<Record<AccountType, string>>(() => ({
  asset: t.value.accountTypes.asset,
  liability: t.value.accountTypes.liability,
  equity: t.value.accountTypes.equity,
  income: t.value.accountTypes.income,
  expense: t.value.accountTypes.expense,
}))

const allOptions = computed(() =>
  accountStore.accounts.filter(a => !a.placeholder)
)

const searchText = computed(() => {
  if (open.value) return query.value
  if (props.modelValue) {
    return accountStore.getFullPath(props.modelValue)
  }
  return ''
})

const filtered = computed(() => {
  if (!query.value) return allOptions.value
  const q = query.value.toLowerCase()
  return allOptions.value.filter(a => {
    const path = accountStore.getFullPath(a.id).toLowerCase()
    return path.includes(q) || a.name.toLowerCase().includes(q)
  })
})

interface GroupedOptions {
  label: string
  items: Account[]
}

const groupedFiltered = computed<GroupedOptions[]>(() => {
  const groups: Partial<Record<AccountType, Account[]>> = {}
  for (const acc of filtered.value) {
    if (!groups[acc.type]) groups[acc.type] = []
    groups[acc.type]!.push(acc)
  }
  return Object.entries(groups).map(([type, items]) => ({
    label: typeLabels.value[type as AccountType],
    items: items!,
  }))
})

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
  highlightedId.value = filtered.value[0]?.id ?? ''
}

function select(id: string) {
  emit('update:modelValue', id)
  query.value = accountStore.getFullPath(id)
  open.value = false
}

function moveHighlight(dir: number) {
  const ids = filtered.value.map(a => a.id)
  if (ids.length === 0) return
  const idx = ids.indexOf(highlightedId.value)
  const next = Math.max(0, Math.min(ids.length - 1, idx + dir))
  highlightedId.value = ids[next]
}

function confirmHighlighted() {
  if (highlightedId.value && filtered.value.some(a => a.id === highlightedId.value)) {
    select(highlightedId.value)
  }
}

// Close on click outside
function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

// When modelValue changes externally (e.g. form reset), sync query
watch(() => props.modelValue, (id) => {
  if (!open.value) {
    query.value = id ? accountStore.getFullPath(id) : ''
  }
})
</script>
