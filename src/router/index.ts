import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('@/views/AccountsView.vue'),
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('@/views/TransactionsView.vue'),
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportsView.vue'),
    },
    {
      path: '/reports/balance-sheet',
      name: 'balance-sheet',
      component: () => import('@/views/BalanceSheetView.vue'),
    },
    {
      path: '/reports/income-statement',
      name: 'income-statement',
      component: () => import('@/views/IncomeStatementView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// On page refresh (F5), always redirect to home
let isInitialLoad = true
router.beforeEach((to) => {
  if (isInitialLoad && to.path !== '/') {
    isInitialLoad = false
    return '/'
  }
  isInitialLoad = false
})

export default router
