import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// This function will be called in the edge environment with the environment variable
export function getDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
