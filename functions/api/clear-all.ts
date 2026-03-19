import { accounts, transactions, splits } from '../../src/db/schema';
import { getDb, json, error } from './_shared';

export const onRequest: PagesFunction<{ DATABASE_URL: string }> = async (ctx) => {
  const { request, env } = ctx;

  if (!env.DATABASE_URL) return error('DATABASE_URL missing', 500);
  if (request.method !== 'POST') return error('Method not allowed', 405);

  const db = getDb(env.DATABASE_URL);

  try {
    await db.delete(splits);
    await db.delete(transactions);
    await db.delete(accounts);
    return json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return error(msg, 500);
  }
};
