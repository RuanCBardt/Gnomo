import { pgTable, text, boolean, integer, timestamp, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  parentId: text('parent_id'),
  description: text('description'),
  currency: text('currency').notNull().default('USD'),
  placeholder: boolean('placeholder').notNull().default(false),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  reconciled: boolean('reconciled').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const splits = pgTable('splits', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  memo: text('memo'),
});

// Relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
    relationName: 'accountToParent'
  }),
  children: many(accounts, { relationName: 'accountToParent' }),
  splits: many(splits),
}));

export const transactionsRelations = relations(transactions, ({ many }) => ({
  splits: many(splits),
}));

export const splitsRelations = relations(splits, ({ one }) => ({
  transaction: one(transactions, {
    fields: [splits.transactionId],
    references: [transactions.id],
  }),
  account: one(accounts, {
    fields: [splits.accountId],
    references: [accounts.id],
  }),
}));
