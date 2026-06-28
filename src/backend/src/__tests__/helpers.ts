import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { generateSlots } from '../services/slots';

export async function setupTestDb() {
  const client = createClient({ url: ':memory:' });
  const db = drizzle(client, { schema });

  client.execute(
    `CREATE TABLE event_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL
    )`,
  );
  client.execute(
    `CREATE TABLE slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      is_booked INTEGER NOT NULL DEFAULT 0
    )`,
  );
  client.execute(
    `CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_email TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      event_type_id INTEGER NOT NULL REFERENCES event_types(id)
    )`,
  );

  const [et1] = await db.insert(schema.eventTypes).values({
    name: 'Консультация',
    description: 'Разбор задачи',
    durationMinutes: 30,
  }).returning().all();

  const [et2] = await db.insert(schema.eventTypes).values({
    name: 'Короткий синк',
    description: 'Быстрая встреча',
    durationMinutes: 15,
  }).returning().all();

  const slotsData = generateSlots(14);
  if (slotsData.length > 0) {
    const inserted = await db.insert(schema.slots).values(slotsData).returning().all();
    return { client, db, schema, eventTypes: [et1, et2], slots: inserted };
  }

  return { client, db, schema, eventTypes: [et1, et2], slots: [] as any[] };
}
