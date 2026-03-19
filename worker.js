import { getDb } from './src/db/index.ts';
import { accounts, transactions, splits } from './src/db/schema.ts';
import { desc, eq } from 'drizzle-orm';

const BASE_PATH = '/gnomo';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      if (!env.DATABASE_URL) {
        return new Response(JSON.stringify({ error: 'Database connection string is missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const db = getDb(env.DATABASE_URL);

      try {
        // Accounts
        if (pathname === '/api/accounts') {
          if (request.method === 'GET') {
            const allAccounts = await db.select().from(accounts);
            return new Response(JSON.stringify(allAccounts), { headers: { 'Content-Type': 'application/json' } });
          }
          if (request.method === 'POST') {
            const body = await request.json();
            const id = body.id || crypto.randomUUID();
            const newAccount = await db.insert(accounts).values({
              id, name: body.name, type: body.type, parentId: body.parentId || null,
              description: body.description || null, currency: body.currency || 'USD',
              placeholder: body.placeholder || false, hidden: body.hidden || false,
            }).returning();
            return new Response(JSON.stringify(newAccount[0]), { status: 201, headers: { 'Content-Type': 'application/json' } });
          }
        }
        
        const accountMatch = pathname.match(/^\/api\/accounts\/(.+)$/);
        if (accountMatch) {
          const id = accountMatch[1];
          if (request.method === 'PUT') {
            const body = await request.json();
            const updated = await db.update(accounts).set({
              name: body.name, type: body.type, parentId: body.parentId || null,
              description: body.description || null, currency: body.currency,
              placeholder: body.placeholder, hidden: body.hidden,
            }).where(eq(accounts.id, id)).returning();
            return new Response(JSON.stringify(updated[0]), { headers: { 'Content-Type': 'application/json' } });
          }
          if (request.method === 'DELETE') {
            await db.delete(accounts).where(eq(accounts.id, id));
            return new Response(null, { status: 204 });
          }
        }

        // Transactions
        if (pathname === '/api/transactions') {
          if (request.method === 'GET') {
            const txs = await db.query.transactions.findMany({
              orderBy: [desc(transactions.date), desc(transactions.createdAt)],
              limit: 500,
              with: { splits: true }
            });
            const formatted = txs.map(t => ({
              ...t,
              date: t.date.toISOString().split('T')[0],
              createdAt: t.createdAt.toISOString(),
            }));
            return new Response(JSON.stringify(formatted), { headers: { 'Content-Type': 'application/json' } });
          }
          if (request.method === 'POST') {
            const body = await request.json();
            const txId = body.id || crypto.randomUUID();
            
            await db.transaction(async (tx) => {
              await tx.insert(transactions).values({
                id: txId,
                date: new Date(body.date),
                description: body.description,
                reconciled: body.reconciled || false,
              });
              
              if (body.splits && body.splits.length > 0) {
                const splitValues = body.splits.map(s => ({
                  id: s.id || crypto.randomUUID(),
                  transactionId: txId,
                  accountId: s.accountId,
                  amount: s.amount,
                  memo: s.memo || null,
                }));
                await tx.insert(splits).values(splitValues);
              }
            });
            
            const newTx = await db.query.transactions.findFirst({
              where: eq(transactions.id, txId),
              with: { splits: true }
            });
            if (newTx) {
              newTx.date = newTx.date.toISOString().split('T')[0];
              newTx.createdAt = newTx.createdAt.toISOString();
            }
            return new Response(JSON.stringify(newTx), { status: 201, headers: { 'Content-Type': 'application/json' } });
          }
        }

        const txMatch = pathname.match(/^\/api\/transactions\/(.+)$/);
        if (txMatch) {
          const id = txMatch[1];
          if (request.method === 'PUT') {
            const body = await request.json();
            await db.transaction(async (tx) => {
              await tx.update(transactions).set({
                date: new Date(body.date),
                description: body.description,
                reconciled: body.reconciled,
              }).where(eq(transactions.id, id));
              
              if (body.splits) {
                await tx.delete(splits).where(eq(splits.transactionId, id));
                const splitValues = body.splits.map(s => ({
                  id: s.id || crypto.randomUUID(),
                  transactionId: id,
                  accountId: s.accountId,
                  amount: s.amount,
                  memo: s.memo || null,
                }));
                await tx.insert(splits).values(splitValues);
              }
            });
            const updated = await db.query.transactions.findFirst({
              where: eq(transactions.id, id),
              with: { splits: true }
            });
            if (updated) {
              updated.date = updated.date.toISOString().split('T')[0];
              updated.createdAt = updated.createdAt.toISOString();
            }
            return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
          }
          if (request.method === 'DELETE') {
            await db.delete(transactions).where(eq(transactions.id, id));
            return new Response(null, { status: 204 });
          }
        }

        // Catch-all for API routes
        if (pathname === '/api/clear-all') {
          if (request.method === 'POST') {
            await db.delete(splits);
            await db.delete(transactions);
            await db.delete(accounts);
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
          }
        }

        return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (pathname.startsWith(BASE_PATH)) {
      pathname = pathname.slice(BASE_PATH.length) || '/';
    }
    const assetRequest = new Request(new URL(pathname, url.origin), request);
    const response = await env.ASSETS.fetch(assetRequest);
    if (response.status !== 404) return response;
    return env.ASSETS.fetch(new Request(new URL('/', url.origin), request));
  },
};
