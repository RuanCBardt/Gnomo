import { accounts } from '../src/db/schema';
import { getDb, json, error } from './_shared';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const db = getDb();

    if (request.method === 'GET') {
      const all = await db.select().from(accounts);
      return json(all);
    }

    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      const id = (body.id as string) || crypto.randomUUID();
      const inserted = await db.insert(accounts).values({
        id,
        name: body.name as string,
        type: body.type as string,
        parentId: (body.parentId as string) || null,
        description: (body.description as string) || null,
        currency: (body.currency as string) || 'USD',
        placeholder: (body.placeholder as boolean) || false,
        hidden: (body.hidden as boolean) || false,
      }).returning();
      return json(inserted[0], 201);
    }

    return error('Method not allowed', 405);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return error(msg, 500);
  }
}
