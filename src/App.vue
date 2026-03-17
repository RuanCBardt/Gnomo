<template>
  <div class="flex h-screen w-screen overflow-hidden bg-[#0a0a0f]">
    <Sidebar />
    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      <Topbar />
      <main class="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>

  <!-- Global Modal -->
  <TransactionModal />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Sidebar from './components/layout/Sidebar.vue'
import Topbar from './components/layout/Topbar.vue'
import TransactionModal from './components/modals/TransactionModal.vue'
import { useAccountStore } from './stores/accounts'
import { useUIStore } from './stores/ui'
import { prefetchAccountRates } from './utils/currency'

const accountStore = useAccountStore()
const ui = useUIStore()

onMounted(async () => {
  const currencies = accountStore.accounts.map(a => a.currency)
  await prefetchAccountRates(currencies, ui.defaultCurrency)
})
</script>
