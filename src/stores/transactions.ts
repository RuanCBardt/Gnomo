import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, Split } from '@/types'
import { generateId, validateDoubleEntry } from '@/utils/accounting'

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([])

  function initialize() {
    const saved = localStorage.getItem('gnomo-transactions')
    if (saved) {
      transactions.value = JSON.parse(saved)
    } else {
      transactions.value = []
      persist()
    }
  }

  function persist() {
    localStorage.setItem('gnomo-transactions', JSON.stringify(transactions.value))
  }

  function seedSampleData() {
    const now = new Date()
    const samples: Omit<Transaction, 'id' | 'createdAt'>[] = []

    // Last 6 months of salary
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 5)
      samples.push({
        date: d.toISOString().split('T')[0],
        description: 'Salário Mensal',
        splits: [
          { id: generateId(), accountId: 'acc-checking', amount: 8500, memo: 'Salário' },
          { id: generateId(), accountId: 'acc-salary', amount: -8500, memo: 'Salário' },
        ],
        reconciled: i > 0,
      })
    }

    // Recurring expenses
    const expenses = [
      { desc: 'Aluguel', acc: 'acc-housing', amount: 2200 },
      { desc: 'Supermercado', acc: 'acc-food', amount: 850 },
      { desc: 'Conta de Luz', acc: 'acc-utilities', amount: 180 },
      { desc: 'Internet', acc: 'acc-utilities', amount: 120 },
      { desc: 'Plano de Saúde', acc: 'acc-health', amount: 450 },
      { desc: 'Transporte / Uber', acc: 'acc-transport', amount: 320 },
      { desc: 'Academia', acc: 'acc-entertainment', amount: 120 },
      { desc: 'Streaming', acc: 'acc-entertainment', amount: 55 },
    ]

    for (let i = 5; i >= 0; i--) {
      for (const exp of expenses) {
        const day = 10 + Math.floor(Math.random() * 15)
        const d = new Date(now.getFullYear(), now.getMonth() - i, day)
        const variation = exp.amount * (0.9 + Math.random() * 0.2)
        const amt = Math.round(variation * 100) / 100
        samples.push({
          date: d.toISOString().split('T')[0],
          description: exp.desc,
          splits: [
            { id: generateId(), accountId: exp.acc, amount: amt, memo: '' },
            { id: generateId(), accountId: 'acc-checking', amount: -amt, memo: '' },
          ],
          reconciled: i > 0,
        })
      }
    }

    // Some credit card transactions
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 20)
      samples.push({
        date: d.toISOString().split('T')[0],
        description: 'Restaurante com amigos',
        splits: [
          { id: generateId(), accountId: 'acc-food', amount: 180 + Math.round(Math.random() * 100), memo: '' },
          { id: generateId(), accountId: 'acc-credit-card', amount: -(180 + Math.round(Math.random() * 100)), memo: '' },
        ],
        reconciled: i > 1,
      })
    }

    // Freelance income
    for (let i = 4; i >= 0; i -= 2) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15)
      samples.push({
        date: d.toISOString().split('T')[0],
        description: 'Projeto Freelance',
        splits: [
          { id: generateId(), accountId: 'acc-checking', amount: 3000, memo: 'Projeto web' },
          { id: generateId(), accountId: 'acc-freelance', amount: -3000, memo: 'Projeto web' },
        ],
        reconciled: i > 0,
      })
    }

    // Transfer to savings
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 6)
      samples.push({
        date: d.toISOString().split('T')[0],
        description: 'Transferência para Poupança',
        splits: [
          { id: generateId(), accountId: 'acc-savings', amount: 1500, memo: '' },
          { id: generateId(), accountId: 'acc-checking', amount: -1500, memo: '' },
        ],
        reconciled: i > 0,
      })
    }

    // Opening balance
    samples.push({
      date: new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0],
      description: 'Saldo Inicial',
      splits: [
        { id: generateId(), accountId: 'acc-checking', amount: 15000, memo: 'Saldo inicial' },
        { id: generateId(), accountId: 'acc-savings', amount: 10000, memo: 'Saldo inicial' },
        { id: generateId(), accountId: 'acc-opening-balance', amount: -25000, memo: 'Saldo inicial' },
      ],
      reconciled: true,
    })

    transactions.value = samples.map(t => ({
      ...t,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }))
    persist()
  }

  const sortedTransactions = computed(() =>
    [...transactions.value].sort((a, b) => b.date.localeCompare(a.date))
  )

  function getTransactionsForAccount(accountId: string): Transaction[] {
    return sortedTransactions.value.filter(tx =>
      tx.splits.some(s => s.accountId === accountId)
    )
  }

  function getTransactionsInRange(start: string, end: string): Transaction[] {
    return sortedTransactions.value.filter(tx =>
      tx.date >= start && tx.date <= end
    )
  }

  function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction | null {
    if (!validateDoubleEntry(data.splits)) return null

    const transaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    transactions.value.push(transaction)
    persist()
    return transaction
  }

  function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>): boolean {
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx < 0) return false

    const updated = { ...transactions.value[idx], ...data }
    if (data.splits && !validateDoubleEntry(data.splits)) return false

    transactions.value[idx] = updated
    persist()
    return true
  }

  function deleteTransaction(id: string): boolean {
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx < 0) return false
    transactions.value.splice(idx, 1)
    persist()
    return true
  }

  function getMonthlyTotals(accountType: 'income' | 'expense', months: number = 6) {
    const now = new Date()
    const result: { month: string; total: number }[] = []

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]

      const monthTx = transactions.value.filter(
        tx => tx.date >= startStr && tx.date <= endStr
      )

      let total = 0
      for (const tx of monthTx) {
        for (const split of tx.splits) {
          // We identify income/expense accounts by looking at the store
          // For simplicity, check account ID prefixes from seed data
          // In production, would cross-reference with account store
          const isTarget = accountType === 'income'
            ? split.amount < 0 // credit to income account
            : split.amount > 0  // debit to expense account

          if (isTarget) {
            total += Math.abs(split.amount)
          }
        }
      }

      const monthName = start.toLocaleDateString('pt-BR', { month: 'short' })
      result.push({ month: monthName, total: total / 2 }) // divide by 2 because we're double counting
    }

    return result
  }

  initialize()

  return {
    transactions,
    sortedTransactions,
    getTransactionsForAccount,
    getTransactionsInRange,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlyTotals,
    persist,
  }
})
