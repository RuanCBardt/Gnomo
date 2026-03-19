import { accounts, transactions, splits } from '../src/db/schema';
import { getDb, json, error } from './_shared';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    if (request.method !== 'POST') return error('Method not allowed', 405);

    const db = getDb();

    await db.delete(splits);
    await db.delete(transactions);
    await db.delete(accounts);
    return json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return error(msg, 500);
  }
}
