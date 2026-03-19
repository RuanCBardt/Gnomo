import { accounts } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { getDb, json, error } from '../_shared';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    // Vercel Edge functions extract dynamic paths into searchParams
    const id = url.searchParams.get('id') || url.pathname.split('/').pop();
    
    if (!id) {
      return error('Missing account ID', 400);
    }

    const db = getDb();

    if (request.method === 'PUT') {
      const body = await request.json() as Record<string, unknown>;
      const updated = await db.update(accounts).set({
        name: body.name as string,
        type: body.type as string,
        parentId: (body.parentId as string) || null,
        description: (body.description as string) || null,
        currency: body.currency as string,
        placeholder: body.placeholder as boolean,
        hidden: body.hidden as boolean,
      }).where(eq(accounts.id, id)).returning();
      return json(updated[0]);
    }

    if (request.method === 'DELETE') {
      await db.delete(accounts).where(eq(accounts.id, id));
      return new Response(null, { status: 204 });
    }

    return error('Method not allowed', 405);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return error(msg, 500);
  }
}
