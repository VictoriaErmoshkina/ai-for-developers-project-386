import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

export { schema };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createClient$1() {
  const dbType = process.env.DB_TYPE ?? 'sqlite';

  if (dbType === 'sqlite') {
    const url = process.env.DATABASE_URL ?? `file:${path.resolve(__dirname, '../../data/calendar.db')}`;
    return createClient({ url });
  }

  if (dbType === 'pg') {
    // future: import { drizzle } from 'drizzle-orm/node-postgres';
    //        import { Pool } from 'pg';
    //        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    //        return drizzle(pool, { schema });
    throw new Error(`PostgreSQL adapter not implemented yet`);
  }

  throw new Error(`Unsupported DB_TYPE: ${dbType}`);
}

function ensureTables(client: ReturnType<typeof createClient$1>) {
  client.execute(
    `CREATE TABLE IF NOT EXISTS event_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL
    )`,
  );
  client.execute(
    `CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      is_booked INTEGER NOT NULL DEFAULT 0
    )`,
  );
  client.execute(
    `CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_email TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      event_type_id INTEGER NOT NULL REFERENCES event_types(id)
    )`,
  );
}

const client = createClient$1();
ensureTables(client);
const db = drizzle(client, { schema });

export default db;
