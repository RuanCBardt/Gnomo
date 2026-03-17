export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'

export interface Account {
  id: string
  name: string
  type: AccountType
  parentId: string | null
  description: string
  currency: string
  placeholder: boolean // group account, cannot hold transactions directly
  hidden: boolean
  createdAt: string
}

export interface Split {
  id: string
  accountId: string
  amount: number // positive = debit, negative = credit (always in project currency)
  originalAmount?: number // value in the account's native currency (if different from project)
  originalCurrency?: string // currency code of the original amount
  memo: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  splits: Split[]
  reconciled: boolean
  createdAt: string
}

export interface AccountBalance {
  account: Account
  balance: number
  children: AccountBalance[]
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Ativos',
  liability: 'Passivos',
  equity: 'Patrimônio Líquido',
  income: 'Receitas',
  expense: 'Despesas',
}

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  asset: '#22c55e',
  liability: '#ef4444',
  equity: '#3b82f6',
  income: '#7c5cfc',
  expense: '#f59e0b',
}

// Debit-positive accounts: debits increase the balance
export function isDebitPositive(type: AccountType): boolean {
  return type === 'asset' || type === 'expense'
}

// Credit-positive accounts: credits increase the balance
export function isCreditPositive(type: AccountType): boolean {
  return type === 'liability' || type === 'equity' || type === 'income'
}
