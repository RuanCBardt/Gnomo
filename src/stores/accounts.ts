import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Account, AccountType, AccountBalance } from '@/types'
import { isDebitPositive } from '@/types'
import { generateId } from '@/utils/accounting'
import { useTransactionStore } from './transactions'

const DEFAULT_ACCOUNTS: Omit<Account, 'createdAt'>[] = [
  // Root accounts (structural — needed for the account tree)
  { id: 'root-asset', name: 'Ativos', type: 'asset', parentId: null, description: 'Todos os ativos', currency: 'GBP', placeholder: true, hidden: false },
  { id: 'root-liability', name: 'Passivos', type: 'liability', parentId: null, description: 'Todas as obrigações', currency: 'GBP', placeholder: true, hidden: false },
  { id: 'root-equity', name: 'Patrimônio Líquido', type: 'equity', parentId: null, description: 'Patrimônio líquido', currency: 'GBP', placeholder: true, hidden: false },
  { id: 'root-income', name: 'Receitas', type: 'income', parentId: null, description: 'Todas as receitas', currency: 'GBP', placeholder: true, hidden: false },
  { id: 'root-expense', name: 'Despesas', type: 'expense', parentId: null, description: 'Todas as despesas', currency: 'GBP', placeholder: true, hidden: false },
]

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([])

  function initialize() {
    const saved = localStorage.getItem('gnomo-accounts')
    if (saved) {
      accounts.value = JSON.parse(saved)
    } else {
      accounts.value = DEFAULT_ACCOUNTS.map(a => ({
        ...a,
        createdAt: new Date().toISOString(),
      }))
      persist()
    }
  }

  function persist() {
    localStorage.setItem('gnomo-accounts', JSON.stringify(accounts.value))
  }

  const rootAccounts = computed(() =>
    accounts.value.filter(a => a.parentId === null)
  )

  function getChildren(parentId: string): Account[] {
    return accounts.value.filter(a => a.parentId === parentId)
  }

  function getAccount(id: string): Account | undefined {
    return accounts.value.find(a => a.id === id)
  }

  function getAccountsByType(type: AccountType): Account[] {
    return accounts.value.filter(a => a.type === type && !a.placeholder)
  }

  function getLeafAccounts(): Account[] {
    return accounts.value.filter(a => !a.placeholder)
  }

  function getAllDescendantIds(parentId: string): string[] {
    const children = getChildren(parentId)
    const ids: string[] = [parentId]
    for (const child of children) {
      ids.push(...getAllDescendantIds(child.id))
    }
    return ids
  }

  function getAccountBalance(accountId: string): number {
    const txStore = useTransactionStore()
    const account = getAccount(accountId)
    if (!account) return 0

    const descendantIds = getAllDescendantIds(accountId)
    let total = 0

    for (const descId of descendantIds) {
      for (const tx of txStore.transactions) {
        for (const split of tx.splits) {
          if (split.accountId === descId) {
            total += split.amount
          }
        }
      }
    }

    // For credit-positive accounts, invert sign for display
    if (!isDebitPositive(account.type)) {
      total = -total
    }

    return total || 0
  }

  function getAccountBalanceTree(type: AccountType): AccountBalance[] {
    const root = accounts.value.find(a => a.type === type && a.parentId === null)
    if (!root) return []

    function buildTree(account: Account): AccountBalance {
      const children = getChildren(account.id).map(buildTree)
      const ownBalance = account.placeholder ? 0 : getDirectBalance(account.id, account.type)
      let childBalance = 0
      for (const child of children) {
        childBalance += child.balance
      }
      return {
        account,
        balance: ownBalance + childBalance,
        children,
      }
    }

    return [buildTree(root)]
  }

  function getDirectBalance(accountId: string, type: AccountType): number {
    const txStore = useTransactionStore()
    let total = 0
    for (const tx of txStore.transactions) {
      for (const split of tx.splits) {
        if (split.accountId === accountId) {
          total += split.amount
        }
      }
    }
    if (!isDebitPositive(type)) {
      total = -total
    }
    return total
  }

  function addAccount(data: Omit<Account, 'id' | 'createdAt'>) {
    const account: Account = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    accounts.value.push(account)
    persist()
    return account
  }

  function updateAccount(id: string, data: Partial<Account>) {
    const idx = accounts.value.findIndex(a => a.id === id)
    if (idx >= 0) {
      accounts.value[idx] = { ...accounts.value[idx], ...data }
      persist()
    }
  }

  function deleteAccount(id: string) {
    // Don't delete if has children or transactions
    const children = getChildren(id)
    if (children.length > 0) return false

    const txStore = useTransactionStore()
    const hasTx = txStore.transactions.some(tx =>
      tx.splits.some(s => s.accountId === id)
    )
    if (hasTx) return false

    accounts.value = accounts.value.filter(a => a.id !== id)
    persist()
    return true
  }

  function getFullPath(accountId: string): string {
    const account = getAccount(accountId)
    if (!account) return ''
    if (!account.parentId) return account.name
    return getFullPath(account.parentId) + ' → ' + account.name
  }

  initialize()

  return {
    accounts,
    rootAccounts,
    getChildren,
    getAccount,
    getAccountsByType,
    getLeafAccounts,
    getAllDescendantIds,
    getAccountBalance,
    getAccountBalanceTree,
    getDirectBalance,
    addAccount,
    updateAccount,
    deleteAccount,
    getFullPath,
    persist,
  }
})
