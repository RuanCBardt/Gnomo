<template>
  <div class="fixed bottom-0 left-0 right-0 z-50 md:hidden">
    <!-- Floating Action Button -->
    <button
      @click="ui.openTransactionModal()"
      class="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full
             bg-gradient-to-r from-[#7c5cfc] to-[#5c8cfc] text-white
             flex items-center justify-center shadow-lg shadow-[#7c5cfc]/40
             active:scale-95 transition-transform duration-150 z-10"
    >
      <Plus class="w-6 h-6" />
    </button>

    <!-- Navigation Bar -->
    <nav
      class="flex items-end justify-around bg-[#0d0d15]/95 backdrop-blur-xl
             border-t border-[#2a2a4a]/60"
      :style="{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }"
    >
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
            'flex flex-col items-center gap-1 pt-2 pb-1 px-3 min-w-[56px] transition-colors duration-200',
            isActive ? 'text-[#7c5cfc]' : 'text-[#6a6a8a]'
          ]"
        >
          <component
            :is="item.icon"
            :class="[
              'w-5 h-5 transition-all duration-200',
              isActive ? 'text-[#7c5cfc]' : 'text-[#6a6a8a]'
            ]"
          />
          <span class="text-[10px] font-medium">{{ item.label }}</span>
          <div
            :class="[
              'w-1 h-1 rounded-full transition-all duration-200',
              isActive ? 'bg-[#7c5cfc]' : 'bg-transparent'
            ]"
          ></div>
        </button>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/i18n'
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-vue-next'

const ui = useUIStore()
const { t } = useI18n()

const navItems = computed(() => [
  { to: '/', label: t.value.nav.dashboard, icon: LayoutDashboard },
  { to: '/accounts', label: t.value.nav.accounts, icon: BookOpen },
  { to: '/transactions', label: '', icon: ArrowLeftRight },
  { to: '/reports', label: t.value.nav.reports, icon: BarChart3 },
  { to: '/settings', label: t.value.nav.settings, icon: Settings },
])
</script>
