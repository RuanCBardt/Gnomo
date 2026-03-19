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

  async function initialize() {
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          accounts.value = data
          return
        }
      }
    } catch (e) {
      console.error('Failed to fetch accounts from API', e)
    }

    // Fallback or Initial setup
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

  async function addAccount(data: Omit<Account, 'id' | 'createdAt'>) {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const account = await res.json()
        accounts.value.push(account)
        return account
      } else {
        console.error('Failed to create account on server')
      }
    } catch (e) {
      console.error('Failed to reach API', e)
    }

    // Fallback if API fails
    const account: Account = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    accounts.value.push(account)
    persist()
    return account
  }

  async function updateAccount(id: string, data: Partial<Account>) {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const updated = await res.json()
        const idx = accounts.value.findIndex(a => a.id === id)
        if (idx >= 0) {
          accounts.value[idx] = updated
        }
        return true
      }
    } catch (e) {
      console.error('Failed to update account on server', e)
    }

    // Fallback
    const idx = accounts.value.findIndex(a => a.id === id)
    if (idx >= 0) {
      accounts.value[idx] = { ...accounts.value[idx], ...data }
      persist()
      return true
    }
    return false
  }

  async function deleteAccount(id: string) {
    // Don't delete if has children or transactions
    const children = getChildren(id)
    if (children.length > 0) return false

    const txStore = useTransactionStore()
    const hasTx = txStore.transactions.some(tx =>
      tx.splits.some(s => s.accountId === id)
    )
    if (hasTx) return false

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        console.error('Failed to delete account from server')
      }
    } catch (e) {
      console.error('Failed to reach API', e)
    }

    accounts.value = accounts.value.filter(a => a.id !== id)
    persist()
    return true
  }

  function getDisplayName(
    account: Account,
    typeLabels?: Partial<Record<AccountType, string>>
  ): string {
    if (account.placeholder && account.parentId === null && typeLabels?.[account.type]) {
      return typeLabels[account.type]!
    }
    return account.name
  }

  function getFullPath(
    accountId: string,
    typeLabels?: Partial<Record<AccountType, string>>
  ): string {
    const account = getAccount(accountId)
    if (!account) return ''
    const displayName = getDisplayName(account, typeLabels)
    if (!account.parentId) return displayName
    return getFullPath(account.parentId, typeLabels) + ' → ' + displayName
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
    getDisplayName,
    getFullPath,
    persist,
  }
})
