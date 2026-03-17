<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="ui.transactionModalOpen" class="fixed inset-0 z-[60] flex items-center p-4" :class="ui.prefillDestinationAccountId ? 'justify-end' : 'justify-center'">
        <!-- Backdrop -->
        <div class="absolute inset-0" :class="ui.prefillDestinationAccountId ? '' : 'bg-black/60 backdrop-blur-sm'" @click="ui.closeTransactionModal()"></div>

        <!-- Modal -->
        <div :class="[
          'relative bg-[#12121a] border border-[#2a2a4a] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300',
          ui.prefillDestinationAccountId ? 'max-w-2xl mr-4' : 'max-w-4xl'
        ]" style="width:100%">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]/60">
            <h2 class="text-lg font-semibold text-[#e8e8f0]">
              {{ isEditing ? t.tx.editTransaction : t.tx.newTransaction }}
            </h2>
            <button
              @click="ui.closeTransactionModal()"
              class="p-1.5 rounded-lg text-[#6a6a8a] hover:text-[#e8e8f0] hover:bg-[#1a1a2e] transition-all duration-200"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
            <!-- Date & Description Row -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-medium text-[#a0a0c0] mb-1.5">{{ t.common.date }}</label>
                <input
                  v-model="form.date"
                  type="date"
                  required
                  class="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0]
                         focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/30
                         transition-all duration-200"
                />
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-medium text-[#a0a0c0] mb-1.5">{{ t.common.description }}</label>
                <input
                  v-model="form.description"
                  type="text"
                  required
                  :placeholder="t.tx.descriptionPlaceholder"
                  class="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#2a2a4a] text-sm text-[#e8e8f0] placeholder:text-[#6a6a8a]
                         focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/30
                         transition-all duration-200"
                />
              </div>
            </div>

            <!-- ===== VISUAL FLOW AREA ===== -->
            <div class="relative grid grid-cols-[1fr_auto_1fr] gap-0 items-start min-h-[160px]">
              <!-- Subtle connecting background -->
              <div class="absolute inset-y-0 left-1/4 right-1/4 bg-gradient-to-r from-transparent via-[#7c5cfc]/[0.03] to-transparent pointer-events-none rounded-2xl"></div>

              <!-- LEFT: Sources (De onde sai) -->
              <div class="pr-3 min-w-0">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse"></div>
                  <span class="text-[10px] font-bold uppercase tracking-widest text-[#ef4444]/80">{{ t.tx.flowFrom }}</span>
                </div>

                <div class="space-y-2">
                  <TransitionGroup name="card">
                    <div
                      v-for="(source, idx) in form.sources"
                      :key="source.id"
                      class="group relative rounded-xl bg-[#0a0a0f] border border-[#ef4444]/20 hover:border-[#ef4444]/40 transition-all duration-300 overflow-hidden"
                    >
                      <!-- Red accent bar -->
                      <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ef4444] to-[#ef4444]/30"></div>

                      <div class="pl-4 pr-3 py-3">
                        <div class="flex items-center gap-1.5">
                          <div class="flex-1 min-w-0">
                            <AccountCombobox
                              v-model="source.accountId"
                              :placeholder="t.tx.selectAccount"
                            />
                          </div>
                          <span
                            v-if="source.accountId && getSourceCurrency(idx) !== ui.defaultCurrency"
                            class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7c5cfc]/15 text-[#7c5cfc]"
                          >
                            {{ getSourceCurrency(idx) }}
                          </span>
                          <button
                            v-if="form.sources.length > 1"
                            type="button"
                            @click="removeSource(idx)"
                            class="p-1 rounded-lg text-[#6a6a8a] opacity-0 group-hover:opacity-100 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <!-- Amount (only in split mode) -->
                        <div v-if="!isSimpleMode" class="mt-2">
                          <input
                            :value="source.amount || ''"
                            @input="setSourceAmount(idx, ($event.target as HTMLInputElement).value)"
                            type="text"
                            inputmode="decimal"
                            placeholder="0,00"
                            class="w-full px-3 py-1.5 rounded-lg bg-[#12121a] border border-[#2a2a4a] text-sm text-[#ef4444]
                                   focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20
                                   transition-all placeholder:text-[#6a6a8a]"
                          />
                        </div>

                        <!-- Foreign currency -->
                        <div v-if="isSourceForeign(idx)" class="mt-1.5 flex items-center gap-2">
                          <span class="text-[10px] text-[#a0a0c0]">{{ t.tx.foreignAmount }} {{ getSourceCurrency(idx) }}</span>
                          <input
                            :value="source.originalAmount || ''"
                            @input="setSourceOriginal(idx, ($event.target as HTMLInputElement).value)"
                            type="text"
                            inputmode="decimal"
                            :placeholder="getSourceCurrency(idx)"
                            class="flex-1 px-2 py-1 rounded-lg bg-[#12121a] border border-[#7c5cfc]/30 text-xs text-[#ef4444]
                                   focus:outline-none focus:border-[#7c5cfc]/50 transition-all placeholder:text-[#6a6a8a]"
                          />
                        </div>
                      </div>
                    </div>
                  </TransitionGroup>
                </div>

                <button
                  type="button"
                  @click="addSource"
                  class="mt-2 flex items-center gap-1 text-xs text-[#ef4444]/60 hover:text-[#ef4444] transition-colors"
                >
                  <Plus class="w-3 h-3" />
                  {{ t.tx.addSource }}
                </button>
              </div>

              <!-- CENTER: Animated Arrow + Amount -->
              <div class="flex flex-col items-center justify-center gap-2 px-2 pt-7">
                <!-- Amount in simple mode -->
                <div v-if="isSimpleMode" class="flex flex-col items-center gap-1">
                  <span class="text-[10px] font-bold text-[#6a6a8a]">{{ ui.defaultCurrency }}</span>
                  <input
                    :value="simpleAmountStr"
                    @input="onSimpleAmountInput(($event.target as HTMLInputElement).value)"
                    type="text"
                    inputmode="decimal"
                    placeholder="0,00"
                    class="w-24 text-center text-lg font-bold px-2 py-1.5 rounded-xl bg-[#0a0a0f] border border-[#7c5cfc]/40 text-[#e8e8f0]
                           focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc]/40
                           transition-all placeholder:text-[#6a6a8a]"
                  />
                </div>

                <!-- Animated arrow with flowing particles -->
                <div class="arrow-container relative w-16 h-12">
                  <svg viewBox="0 0 64 48" class="w-full h-full">
                    <defs>
                      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#ef4444" stop-opacity="0.5" />
                        <stop offset="50%" stop-color="#7c5cfc" stop-opacity="0.8" />
                        <stop offset="100%" stop-color="#22c55e" stop-opacity="0.5" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <!-- Background line -->
                    <line x1="4" y1="24" x2="48" y2="24" stroke="#2a2a4a" stroke-width="2" stroke-linecap="round" />
                    <!-- Flowing dashes -->
                    <line x1="4" y1="24" x2="48" y2="24" stroke="url(#flowGrad)" stroke-width="2" stroke-dasharray="8 6" stroke-linecap="round" class="flow-dash" filter="url(#glow)" />
                    <!-- Arrowhead -->
                    <polygon points="48,18 60,24 48,30" fill="#22c55e" opacity="0.8" class="arrow-pulse" />
                  </svg>

                  <!-- Floating particles -->
                  <div class="absolute inset-0 overflow-hidden pointer-events-none">
                    <div class="flow-particle" style="--delay: 0s; --y: 40%"></div>
                    <div class="flow-particle" style="--delay: 0.7s; --y: 55%"></div>
                    <div class="flow-particle" style="--delay: 1.4s; --y: 48%"></div>
                  </div>
                </div>
              </div>

              <!-- RIGHT: Destinations (Para onde vai) -->
              <div class="pl-3 min-w-0">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
                  <span class="text-[10px] font-bold uppercase tracking-widest text-[#22c55e]/80">{{ t.tx.flowTo }}</span>
                </div>

                <div class="space-y-2">
                  <TransitionGroup name="card">
                    <div
                      v-for="(dest, idx) in form.destinations"
                      :key="dest.id"
                      class="group relative rounded-xl bg-[#0a0a0f] border border-[#22c55e]/20 hover:border-[#22c55e]/40 transition-all duration-300 overflow-hidden"
                    >
                      <!-- Green accent bar -->
                      <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#22c55e] to-[#22c55e]/30"></div>

                      <div class="pl-4 pr-3 py-3">
                        <div class="flex items-center gap-1.5">
                          <div class="flex-1 min-w-0">
                            <AccountCombobox
                              v-model="dest.accountId"
                              :placeholder="t.tx.selectAccount"
                            />
                          </div>
                          <span
                            v-if="dest.accountId && getDestCurrency(idx) !== ui.defaultCurrency"
                            class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7c5cfc]/15 text-[#7c5cfc]"
                          >
                            {{ getDestCurrency(idx) }}
                          </span>
                          <button
                            v-if="form.destinations.length > 1"
                            type="button"
                            @click="removeDestination(idx)"
                            class="p-1 rounded-lg text-[#6a6a8a] opacity-0 group-hover:opacity-100 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <!-- Amount (only in split mode) -->
                        <div v-if="!isSimpleMode" class="mt-2">
                          <input
                            :value="dest.amount || ''"
                            @input="setDestAmount(idx, ($event.target as HTMLInputElement).value)"
                            type="text"
                            inputmode="decimal"
                            placeholder="0,00"
                            class="w-full px-3 py-1.5 rounded-lg bg-[#12121a] border border-[#2a2a4a] text-sm text-[#22c55e]
                                   focus:outline-none focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/20
                                   transition-all placeholder:text-[#6a6a8a]"
                          />
                        </div>

                        <!-- Foreign currency -->
                        <div v-if="isDestForeign(idx)" class="mt-1.5 flex items-center gap-2">
                          <span class="text-[10px] text-[#a0a0c0]">{{ t.tx.foreignAmount }} {{ getDestCurrency(idx) }}</span>
                          <input
                            :value="dest.originalAmount || ''"
                            @input="setDestOriginal(idx, ($event.target as HTMLInputElement).value)"
                            type="text"
                            inputmode="decimal"
                            :placeholder="getDestCurrency(idx)"
                            class="flex-1 px-2 py-1 rounded-lg bg-[#12121a] border border-[#7c5cfc]/30 text-xs text-[#22c55e]
                                   focus:outline-none focus:border-[#7c5cfc]/50 transition-all placeholder:text-[#6a6a8a]"
                          />
                        </div>
                      </div>
                    </div>
                  </TransitionGroup>
                </div>

                <button
                  type="button"
                  @click="addDestination"
                  class="mt-2 flex items-center gap-1 text-xs text-[#22c55e]/60 hover:text-[#22c55e] transition-colors"
                >
                  <Plus class="w-3 h-3" />
                  {{ t.tx.addDestination }}
                </button>
              </div>
            </div>

            <!-- Balance indicator -->
            <div class="flex items-center justify-between px-1">
              <div class="flex items-center gap-2">
                <div :class="[
                  'w-2 h-2 rounded-full transition-colors duration-300',
                  isBalanced ? 'bg-[#22c55e]' : 'bg-[#ef4444] animate-pulse'
                ]"></div>
                <span :class="[
                  'text-xs transition-colors duration-300',
                  isBalanced ? 'text-[#22c55e]' : 'text-[#ef4444]'
                ]">
                  {{ isBalanced ? t.tx.balanced : `${t.tx.difference} ${formatCurrency(difference, ui.defaultCurrency)}` }}
                </span>
              </div>
              <div v-if="!isSimpleMode" class="text-xs text-[#6a6a8a]">
                {{ t.tx.flowFrom }}: {{ formatCurrency(totalSources, ui.defaultCurrency) }} &rarr; {{ t.tx.flowTo }}: {{ formatCurrency(totalDestinations, ui.defaultCurrency) }}
              </div>
            </div>

            <!-- Multi-currency implied rate -->
            <div v-if="impliedRate" class="px-3 py-2 rounded-xl bg-[#7c5cfc]/5 border border-[#7c5cfc]/20">
              <div class="flex items-center gap-2 text-xs">
                <span class="text-[#a0a0c0]">
                  {{ t.tx.impliedRate }} 1 {{ impliedRate.from }} = {{ impliedRate.rate }} {{ impliedRate.to }}
                </span>
              </div>
            </div>

            <!-- Error message -->
            <div v-if="error" class="px-4 py-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-sm text-[#ef4444]">
              {{ error }}
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                @click="ui.closeTransactionModal()"
                class="px-4 py-2 rounded-xl text-sm text-[#a0a0c0] hover:text-[#e8e8f0] hover:bg-[#1a1a2e] transition-all duration-200"
              >
                {{ t.common.cancel }}
              </button>
              <button
                v-if="!isEditing && ui.prefillDestinationAccountId"
                type="button"
                :disabled="!isBalanced"
                @click="handleSubmitAndNew"
                :class="[
                  'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  isBalanced
                    ? 'bg-[#1a1a2e] border border-[#7c5cfc]/40 text-[#7c5cfc] hover:bg-[#7c5cfc]/10 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-[#2a2a4a] text-[#6a6a8a] cursor-not-allowed'
                ]"
              >
                {{ t.tx.registerAndNew }}
              </button>
              <button
                type="submit"
                :disabled="!isBalanced"
                :class="[
                  'px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  isBalanced
                    ? 'bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] text-white hover:shadow-lg hover:shadow-[#7c5cfc]/30 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-[#2a2a4a] text-[#6a6a8a] cursor-not-allowed'
                ]"
              >
                {{ isEditing ? t.tx.saveChanges : t.tx.register }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useAccountStore } from '@/stores/accounts'
import { useTransactionStore } from '@/stores/transactions'
import { formatCurrency, today, generateId } from '@/utils/accounting'
import { X, Plus, Trash2 } from 'lucide-vue-next'
import AccountCombobox from '@/components/ui/AccountCombobox.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const ui = useUIStore()
const accountStore = useAccountStore()
const txStore = useTransactionStore()
const error = ref('')

interface FlowEntry {
  id: string
  accountId: string
  amount: number
  originalAmount: number
}

function newEntry(): FlowEntry {
  return { id: generateId(), accountId: '', amount: 0, originalAmount: 0 }
}

const form = ref({
  date: today(),
  description: '',
  sources: [newEntry()] as FlowEntry[],
  destinations: [newEntry()] as FlowEntry[],
})

const simpleAmountStr = ref('')

const isEditing = computed(() => ui.editingTransactionId !== null)

const isSimpleMode = computed(() =>
  form.value.sources.length === 1 && form.value.destinations.length === 1
)

const parsedSimpleAmount = computed(() =>
  parseFloat(simpleAmountStr.value.replace(',', '.')) || 0
)

// Watch modal open to reset or populate form
watch(() => ui.transactionModalOpen, (open) => {
  if (open) {
    error.value = ''
    if (ui.editingTransactionId) {
      const tx = txStore.transactions.find(t => t.id === ui.editingTransactionId)
      if (tx) {
        const sources = tx.splits
          .filter(s => s.amount < 0)
          .map(s => ({
            id: generateId(),
            accountId: s.accountId,
            amount: -s.amount,
            originalAmount: s.originalAmount ? Math.abs(s.originalAmount) : 0,
          }))
        const destinations = tx.splits
          .filter(s => s.amount > 0)
          .map(s => ({
            id: generateId(),
            accountId: s.accountId,
            amount: s.amount,
            originalAmount: s.originalAmount ? Math.abs(s.originalAmount) : 0,
          }))

        form.value = {
          date: tx.date,
          description: tx.description,
          sources: sources.length ? sources : [newEntry()],
          destinations: destinations.length ? destinations : [newEntry()],
        }

        if (sources.length === 1 && destinations.length === 1) {
          simpleAmountStr.value = String(destinations[0].amount)
        } else {
          simpleAmountStr.value = ''
        }
        return
      }
    }
    // Reset form
    const destEntry = newEntry()
    if (ui.prefillDestinationAccountId) {
      destEntry.accountId = ui.prefillDestinationAccountId
    }
    form.value = {
      date: today(),
      description: '',
      sources: [newEntry()],
      destinations: [destEntry],
    }
    simpleAmountStr.value = ''
  }
})

// --- Currency helpers ---

function getSourceCurrency(idx: number): string {
  const acc = accountStore.getAccount(form.value.sources[idx]?.accountId)
  return acc?.currency ?? ui.defaultCurrency
}

function getDestCurrency(idx: number): string {
  const acc = accountStore.getAccount(form.value.destinations[idx]?.accountId)
  return acc?.currency ?? ui.defaultCurrency
}

function isSourceForeign(idx: number): boolean {
  return !!form.value.sources[idx]?.accountId && getSourceCurrency(idx) !== ui.defaultCurrency
}

function isDestForeign(idx: number): boolean {
  return !!form.value.destinations[idx]?.accountId && getDestCurrency(idx) !== ui.defaultCurrency
}

const isMultiCurrency = computed(() => {
  const currencies = new Set<string>()
  for (let i = 0; i < form.value.sources.length; i++) currencies.add(getSourceCurrency(i))
  for (let i = 0; i < form.value.destinations.length; i++) currencies.add(getDestCurrency(i))
  return currencies.size > 1
})

const impliedRate = computed(() => {
  if (!isMultiCurrency.value) return null
  const entries = [
    ...form.value.sources.map((s, i) => ({ ...s, currency: getSourceCurrency(i) })),
    ...form.value.destinations.map((d, i) => ({ ...d, currency: getDestCurrency(i) })),
  ]
  for (const entry of entries) {
    if (entry.currency === ui.defaultCurrency) continue
    const amount = isSimpleMode.value ? parsedSimpleAmount.value : entry.amount
    if (amount > 0.001 && entry.originalAmount > 0.001) {
      return {
        rate: (entry.originalAmount / amount).toFixed(4),
        from: ui.defaultCurrency,
        to: entry.currency,
      }
    }
  }
  return null
})

// --- Totals & Balance ---

const totalSources = computed(() =>
  isSimpleMode.value
    ? parsedSimpleAmount.value
    : form.value.sources.reduce((sum, s) => sum + (s.amount || 0), 0)
)

const totalDestinations = computed(() =>
  isSimpleMode.value
    ? parsedSimpleAmount.value
    : form.value.destinations.reduce((sum, d) => sum + (d.amount || 0), 0)
)

const difference = computed(() => totalDestinations.value - totalSources.value)

const isBalanced = computed(() => {
  if (isSimpleMode.value) {
    if (parsedSimpleAmount.value <= 0) return false
  } else {
    if (Math.abs(difference.value) >= 0.005 || totalDestinations.value <= 0) return false
  }

  if (isMultiCurrency.value) {
    for (let i = 0; i < form.value.sources.length; i++) {
      if (getSourceCurrency(i) !== ui.defaultCurrency) {
        if (Math.abs(form.value.sources[i].originalAmount) < 0.001) return false
      }
    }
    for (let i = 0; i < form.value.destinations.length; i++) {
      if (getDestCurrency(i) !== ui.defaultCurrency) {
        if (Math.abs(form.value.destinations[i].originalAmount) < 0.001) return false
      }
    }
  }

  return true
})

// --- Amount setters ---

function onSimpleAmountInput(value: string) {
  simpleAmountStr.value = value
}

function setSourceAmount(idx: number, value: string) {
  form.value.sources[idx].amount = Math.abs(parseFloat(value.replace(',', '.')) || 0)
}

function setDestAmount(idx: number, value: string) {
  form.value.destinations[idx].amount = Math.abs(parseFloat(value.replace(',', '.')) || 0)
}

function setSourceOriginal(idx: number, value: string) {
  form.value.sources[idx].originalAmount = parseFloat(value.replace(',', '.')) || 0
}

function setDestOriginal(idx: number, value: string) {
  form.value.destinations[idx].originalAmount = parseFloat(value.replace(',', '.')) || 0
}

// --- Add / Remove entries ---

function addSource() {
  if (isSimpleMode.value && parsedSimpleAmount.value > 0) {
    form.value.sources[0].amount = parsedSimpleAmount.value
    form.value.destinations[0].amount = parsedSimpleAmount.value
  }
  form.value.sources.push(newEntry())
}

function addDestination() {
  if (isSimpleMode.value && parsedSimpleAmount.value > 0) {
    form.value.sources[0].amount = parsedSimpleAmount.value
    form.value.destinations[0].amount = parsedSimpleAmount.value
  }
  form.value.destinations.push(newEntry())
}

function removeSource(idx: number) {
  form.value.sources.splice(idx, 1)
  if (form.value.sources.length === 1 && form.value.destinations.length === 1) {
    simpleAmountStr.value = form.value.destinations[0].amount ? String(form.value.destinations[0].amount) : ''
  }
}

function removeDestination(idx: number) {
  form.value.destinations.splice(idx, 1)
  if (form.value.sources.length === 1 && form.value.destinations.length === 1) {
    simpleAmountStr.value = form.value.sources[0].amount ? String(form.value.sources[0].amount) : ''
  }
}

// --- Submit ---

function doSubmit(): boolean {
  error.value = ''

  if (!form.value.description.trim()) {
    error.value = t.value.tx.errDescription
    return false
  }

  const allEntries = [...form.value.sources, ...form.value.destinations]
  if (allEntries.some(e => !e.accountId)) {
    error.value = t.value.tx.errAccount
    return false
  }

  if (!isBalanced.value) {
    error.value = t.value.tx.errBalance
    return false
  }

  const splits = []

  // Sources → credits (negative amounts)
  for (let i = 0; i < form.value.sources.length; i++) {
    const source = form.value.sources[i]
    const amount = isSimpleMode.value ? parsedSimpleAmount.value : source.amount
    const currency = getSourceCurrency(i)
    const isForeign = currency !== ui.defaultCurrency
    splits.push({
      id: generateId(),
      accountId: source.accountId,
      amount: -amount,
      memo: '',
      ...(isForeign ? {
        originalAmount: -source.originalAmount,
        originalCurrency: currency,
      } : {}),
    })
  }

  // Destinations → debits (positive amounts)
  for (let i = 0; i < form.value.destinations.length; i++) {
    const dest = form.value.destinations[i]
    const amount = isSimpleMode.value ? parsedSimpleAmount.value : dest.amount
    const currency = getDestCurrency(i)
    const isForeign = currency !== ui.defaultCurrency
    splits.push({
      id: generateId(),
      accountId: dest.accountId,
      amount: amount,
      memo: '',
      ...(isForeign ? {
        originalAmount: dest.originalAmount,
        originalCurrency: currency,
      } : {}),
    })
  }

  if (isEditing.value) {
    const ok = txStore.updateTransaction(ui.editingTransactionId!, {
      date: form.value.date,
      description: form.value.description,
      splits,
    })
    if (!ok) {
      error.value = t.value.tx.errSave
      return false
    }
  } else {
    const tx = txStore.addTransaction({
      date: form.value.date,
      description: form.value.description,
      splits,
      reconciled: false,
    })
    if (!tx) {
      error.value = t.value.tx.errSave
      return false
    }
  }

  return true
}

function handleSubmit() {
  const saved = doSubmit()
  if (!saved) return
  ui.closeTransactionModal()
}

function handleSubmitAndNew() {
  const saved = doSubmit()
  if (!saved) return

  // Reset form but keep the same destination prefill
  const prefillAccountId = ui.prefillDestinationAccountId
  const destEntry = newEntry()
  if (prefillAccountId) {
    destEntry.accountId = prefillAccountId
  }
  form.value = {
    date: today(),
    description: '',
    sources: [newEntry()],
    destinations: [destEntry],
  }
  simpleAmountStr.value = ''
  error.value = ''
}
</script>

<style scoped>
@keyframes flowDash {
  from { stroke-dashoffset: 14; }
  to { stroke-dashoffset: 0; }
}
.flow-dash {
  animation: flowDash 1s linear infinite;
}

@keyframes arrowPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.arrow-pulse {
  animation: arrowPulse 2s ease-in-out infinite;
}

@keyframes particleFlow {
  0% { left: -4px; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 0.6; }
  100% { left: calc(100% + 4px); opacity: 0; }
}
.flow-particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #7c5cfc;
  box-shadow: 0 0 6px 2px rgba(124, 92, 252, 0.4);
  top: var(--y, 50%);
  transform: translateY(-50%);
  animation: particleFlow 2s ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

.arrow-container:hover .flow-dash {
  stroke-width: 3;
}

.card-enter-active,
.card-leave-active {
  transition: all 0.3s ease;
}
.card-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
.card-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
