import { transactions, splits } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { getDb, json, error } from '../_shared';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || url.pathname.split('/').pop();

    if (!id) {
      return error('Missing transaction ID', 400);
    }

    const db = getDb();

    if (request.method === 'PUT') {
      const body = await request.json() as Record<string, unknown>;
      await db.transaction(async (tx) => {
        await tx.update(transactions).set({
          date: new Date(body.date as string),
          description: body.description as string,
          reconciled: body.reconciled as boolean,
        }).where(eq(transactions.id, id));

        const rawSplits = body.splits as Array<Record<string, unknown>>;
        if (rawSplits) {
          await tx.delete(splits).where(eq(splits.transactionId, id));
          const splitValues = rawSplits.map(s => ({
            id: (s.id as string) || crypto.randomUUID(),
            transactionId: id,
            accountId: s.accountId as string,
            amount: s.amount as number,
            memo: (s.memo as string) || null,
          }));
          await tx.insert(splits).values(splitValues);
        }
      });

      const updated = await db.query.transactions.findFirst({
        where: eq(transactions.id, id),
        with: { splits: true },
      });
      if (updated) {
        (updated as Record<string, unknown>).date = updated.date.toISOString().split('T')[0];
        (updated as Record<string, unknown>).createdAt = updated.createdAt.toISOString();
      }
      return json(updated);
    }

    if (request.method === 'DELETE') {
      await db.delete(transactions).where(eq(transactions.id, id));
      return new Response(null, { status: 204 });
    }

    return error('Method not allowed', 405);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return error(msg, 500);
  }
}
