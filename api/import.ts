import { accounts, transactions, splits } from '../src/db/schema';
import { getDb, json, error } from './_shared';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    if (request.method !== 'POST') return error('Method not allowed', 405);

    const db = getDb();
    const data = await request.json() as Record<string, unknown>;

    // 1. Wipe existing data
    await db.delete(splits);
    await db.delete(transactions);
    await db.delete(accounts);

    // 2. Insert Accounts
    const rawAccounts = data.accounts as Array<Record<string, unknown>>;
    const validAccountIds = new Set<string>();
    if (rawAccounts && rawAccounts.length > 0) {
      const importAccounts = [];
      for (const a of rawAccounts) {
        if (!validAccountIds.has(a.id as string)) {
          validAccountIds.add(a.id as string);
          importAccounts.push({
            id: a.id as string,
            name: a.name as string,
            type: a.type as string,
            parentId: (a.parentId as string) || null,
            description: (a.description as string) || null,
            currency: (a.currency as string) || 'USD',
            placeholder: (a.placeholder as boolean) || false,
            hidden: (a.hidden as boolean) || false,
            createdAt: a.createdAt ? new Date(a.createdAt as string) : new Date(),
          });
        }
      }
      for (let i = 0; i < importAccounts.length; i += 500) {
        await db.insert(accounts).values(importAccounts.slice(i, i + 500));
      }
    }

    // 3. Insert Transactions & Splits
    const rawTxs = data.transactions as Array<Record<string, unknown>>;
    if (rawTxs && rawTxs.length > 0) {
      const validTxIds = new Set<string>();
      const importTxs = [];
      for (const t of rawTxs) {
        if (!validTxIds.has(t.id as string)) {
          validTxIds.add(t.id as string);
          importTxs.push({
            id: t.id as string,
            date: new Date(t.date as string),
            description: t.description as string,
            reconciled: (t.reconciled as boolean) || false,
            createdAt: t.createdAt ? new Date(t.createdAt as string) : new Date(),
          });
        }
      }
      
      for (let i = 0; i < importTxs.length; i += 500) {
        await db.insert(transactions).values(importTxs.slice(i, i + 500));
      }

      const validSplitIds = new Set<string>();
      const allSplits = rawTxs.flatMap(t => {
        const tSplits = t.splits as Array<Record<string, unknown>>;
        return (tSplits || []).map(s => ({
          id: s.id as string,
          transactionId: t.id as string,
          accountId: s.accountId as string,
          amount: Number(s.amount) || 0,
          memo: (s.memo as string) || null,
        }));
      }).filter(s => {
        // Must reference valid account and tx
        if (!validAccountIds.has(s.accountId) || !validTxIds.has(s.transactionId)) return false;
        // Must not be duplicate split ID
        if (validSplitIds.has(s.id)) return false;
        validSplitIds.add(s.id);
        return true;
      });

      if (allSplits.length > 0) {
        for (let i = 0; i < allSplits.length; i += 500) {
          await db.insert(splits).values(allSplits.slice(i, i + 500));
        }
      }
    }

    return json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return error(msg, 500);
  }
}
