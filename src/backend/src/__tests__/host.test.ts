import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schemaModule from '../db/schema';

const testClient = createClient({ url: ':memory:' });
const testDb = drizzle(testClient, { schema: schemaModule });

testClient.execute(`CREATE TABLE event_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL, duration_minutes INTEGER NOT NULL)`);
testClient.execute(`CREATE TABLE slots (id INTEGER PRIMARY KEY AUTOINCREMENT, start TEXT NOT NULL, end TEXT NOT NULL, is_booked INTEGER NOT NULL DEFAULT 0)`);
testClient.execute(`CREATE TABLE bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, guest_email TEXT NOT NULL, start TEXT NOT NULL, end TEXT NOT NULL, event_type_id INTEGER NOT NULL REFERENCES event_types(id))`);

vi.mock('../db', () => ({
  default: testDb,
  schema: schemaModule,
}));

let app: any;

beforeAll(async () => {
  const mod = await import('../routes/host');
  const { Hono } = await import('hono');
  const { cors } = await import('hono/cors');
  const hono = new Hono();
  hono.use('/*', cors());
  hono.route('/host', mod.default);
  app = hono;
});

describe('Host API', () => {
  it('POST /host/event-types creates a new event type', async () => {
    const payload = {
      id: 0,
      name: 'Новый тип',
      description: 'Новое описание',
      durationMinutes: 45,
    };
    const res = await app.request('/host/event-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('Новый тип');
    expect(body.durationMinutes).toBe(45);
  });

  it('POST /host/event-types updates existing event type', async () => {
    const [existing] = await testDb.insert(schemaModule.eventTypes).values({
      name: 'Старый тип',
      description: 'Старое описание',
      durationMinutes: 20,
    }).returning().all();

    const payload = {
      id: existing.id,
      name: 'Обновлённый тип',
      description: 'Обновлённое описание',
      durationMinutes: 30,
    };
    const res = await app.request('/host/event-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Обновлённый тип');
    expect(body.durationMinutes).toBe(30);
  });

  it('GET /host/bookings returns all bookings', async () => {
    const [et] = await testDb.insert(schemaModule.eventTypes).values({
      name: 'Test', description: 'Desc', durationMinutes: 30,
    }).returning().all();

    await testDb.insert(schemaModule.bookings).values({
      guestEmail: 'guest@test.com',
      start: '2026-06-29T09:00:00.000Z',
      end: '2026-06-29T09:30:00.000Z',
      eventTypeId: et.id,
    }).run();

    const res = await app.request('/host/bookings');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('guestEmail');
    expect(body[0]).toHaveProperty('slot');
    expect(body[0]).toHaveProperty('eventType');
  });
});
