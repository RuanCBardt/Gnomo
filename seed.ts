import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { accounts, transactions, splits } from './src/db/schema';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const DEFAULT_ACCOUNTS = [
  { id: 'root-asset', name: 'Assets', type: 'asset', parentId: null, description: 'All assets', currency: 'USD', placeholder: true, hidden: false },
  { id: 'root-liability', name: 'Liabilities', type: 'liability', parentId: null, description: 'All liabilities', currency: 'USD', placeholder: true, hidden: false },
  { id: 'root-equity', name: 'Equity', type: 'equity', parentId: null, description: 'Net equity', currency: 'USD', placeholder: true, hidden: false },
  { id: 'root-income', name: 'Income', type: 'income', parentId: null, description: 'All income', currency: 'USD', placeholder: true, hidden: false },
  { id: 'root-expense', name: 'Expenses', type: 'expense', parentId: null, description: 'All expenses', currency: 'USD', placeholder: true, hidden: false },
] as const;

async function seed() {
  console.log('Deleting existing transactions and splits...');
  await db.delete(splits);
  await db.delete(transactions);

  console.log('Deleting existing accounts...');
  await db.delete(accounts);
  
  console.log('Inserting default root accounts...');
  for (const acc of DEFAULT_ACCOUNTS) {
    await db.insert(accounts).values(acc);
  }
  
  console.log('Seed complete!');
}

seed().catch(console.error);
