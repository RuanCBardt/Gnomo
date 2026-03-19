import { transactions, splits } from '../../src/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getDb, json, error } from './_shared';

export const onRequest: PagesFunction<{ DATABASE_URL: string }> = async (ctx) => {
  const { request, env } = ctx;

  if (!env.DATABASE_URL) return error('DATABASE_URL missing', 500);
  const db = getDb(env.DATABASE_URL);

  try {
    if (request.method === 'GET') {
      const txs = await db.query.transactions.findMany({
        orderBy: [desc(transactions.date), desc(transactions.createdAt)],
        limit: 500,
        with: { splits: true },
      });
      const formatted = txs.map(t => ({
        ...t,
        date: t.date.toISOString().split('T')[0],
        createdAt: t.createdAt.toISOString(),
      }));
      return json(formatted);
    }

    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      const txId = (body.id as string) || crypto.randomUUID();

      await db.transaction(async (tx) => {
        await tx.insert(transactions).values({
          id: txId,
          date: new Date(body.date as string),
          description: body.description as string,
          reconciled: (body.reconciled as boolean) || false,
        });
        const rawSplits = body.splits as Array<Record<string, unknown>>;
        if (rawSplits && rawSplits.length > 0) {
          const splitValues = rawSplits.map(s => ({
            id: (s.id as string) || crypto.randomUUID(),
            transactionId: txId,
            accountId: s.accountId as string,
            amount: s.amount as number,
            memo: (s.memo as string) || null,
          }));
          await tx.insert(splits).values(splitValues);
        }
      });

      const newTx = await db.query.transactions.findFirst({
        where: eq(transactions.id, txId),
        with: { splits: true },
      });
      if (newTx) {
        (newTx as Record<string, unknown>).date = newTx.date.toISOString().split('T')[0];
        (newTx as Record<string, unknown>).createdAt = newTx.createdAt.toISOString();
      }
      return json(newTx, 201);
    }

    return error('Method not allowed', 405);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return error(msg, 500);
  }
};
