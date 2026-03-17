<template>
  <aside
    :class="[
      'flex flex-col border-r border-[#2a2a4a]/60 bg-[#0d0d15] transition-all duration-300 ease-out shrink-0',
      collapsed ? 'w-[68px]' : 'w-[260px]'
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 h-16 border-b border-[#2a2a4a]/40 shrink-0">
      <div class="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c5cfc] to-[#5c8cfc] shadow-lg shadow-[#7c5cfc]/20 shrink-0">
        <Landmark class="w-5 h-5 text-white" />
      </div>
      <span
        v-if="!collapsed"
        class="text-lg font-bold tracking-tight bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] bg-clip-text text-transparent whitespace-nowrap overflow-hidden"
      >
        Gnomo
      </span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        custom
        v-slot="{ isActive, navigate }"
      >
        <button
          @click="navigate"
          :class="[
            'group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden',
            isActive
              ? 'bg-[#7c5cfc]/15 text-[#7c5cfc] shadow-sm shadow-[#7c5cfc]/10'
              : 'text-[#a0a0c0] hover:bg-[#1a1a2e] hover:text-[#e8e8f0]'
          ]"
        >
          <component
            :is="item.icon"
            :class="[
              'w-5 h-5 shrink-0 transition-all duration-200',
              isActive ? 'text-[#7c5cfc]' : 'text-[#6a6a8a] group-hover:text-[#a0a0c0]'
            ]"
          />
          <span v-if="!collapsed" class="whitespace-nowrap overflow-hidden">{{ item.label }}</span>
          <span
            v-if="!collapsed && item.badge"
            class="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] shrink-0"
          >
            {{ item.badge }}
          </span>
        </button>
      </router-link>
    </nav>

    <!-- New transaction button -->
    <div class="p-3 border-t border-[#2a2a4a]/40 shrink-0">
      <button
        @click="ui.openTransactionModal()"
        class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm
               bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] text-white
               hover:shadow-lg hover:shadow-[#7c5cfc]/30 hover:scale-[1.02]
               active:scale-[0.98] transition-all duration-200 overflow-hidden"
      >
        <Plus class="w-4 h-4 shrink-0" />
        <span v-if="!collapsed" class="whitespace-nowrap">{{ t.tx.newTransaction }}</span>
      </button>
    </div>

    <!-- Collapse toggle -->
    <div class="p-3 border-t border-[#2a2a4a]/40 shrink-0">
      <button
        @click="ui.toggleSidebar()"
        class="flex items-center justify-center w-full py-2 rounded-lg text-[#6a6a8a] hover:text-[#a0a0c0] hover:bg-[#1a1a2e] transition-all duration-200"
      >
        <PanelLeftClose v-if="!collapsed" class="w-4 h-4" />
        <PanelLeftOpen v-else class="w-4 h-4" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useTransactionStore } from '@/stores/transactions'
import { useI18n } from '@/i18n'
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  BarChart3,
  Landmark,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-vue-next'

const ui = useUIStore()
const txStore = useTransactionStore()
const collapsed = computed(() => ui.sidebarCollapsed)
const { t } = useI18n()

const navItems = computed(() => [
  { to: '/', label: t.value.nav.dashboard, icon: LayoutDashboard, badge: null },
  { to: '/accounts', label: t.value.nav.accounts, icon: BookOpen, badge: null },
  { to: '/transactions', label: t.value.nav.transactions, icon: ArrowLeftRight, badge: txStore.transactions.length },
  { to: '/reports', label: t.value.nav.reports, icon: BarChart3, badge: null },
  { to: '/settings', label: t.value.nav.settings, icon: Settings, badge: null },
])
</script>
