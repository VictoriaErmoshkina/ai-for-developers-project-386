import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { generateSlots } from '../services/slots';
import * as schemaModule from '../db/schema';

const testClient = createClient({ url: ':memory:' });
const testDb = drizzle(testClient, { schema: schemaModule });

testClient.execute(`CREATE TABLE event_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL, duration_minutes INTEGER NOT NULL)`);
testClient.execute(`CREATE TABLE slots (id INTEGER PRIMARY KEY AUTOINCREMENT, start TEXT NOT NULL, end TEXT NOT NULL, is_booked INTEGER NOT NULL DEFAULT 0)`);
testClient.execute(`CREATE TABLE bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, guest_email TEXT NOT NULL, start TEXT NOT NULL, end TEXT NOT NULL, event_type_id INTEGER NOT NULL REFERENCES event_types(id))`);

const [et1] = await testDb.insert(schemaModule.eventTypes).values({ name: 'Консультация', description: 'Разбор задачи', durationMinutes: 30 }).returning().all();
const [et2] = await testDb.insert(schemaModule.eventTypes).values({ name: 'Короткий синк', description: 'Быстрая встреча', durationMinutes: 15 }).returning().all();

const slotsData = generateSlots(14);
const insertedSlots = await testDb.insert(schemaModule.slots).values(slotsData).returning().all();

vi.mock('../db', () => ({
  default: testDb,
  schema: schemaModule,
}));

let app: any;

beforeAll(async () => {
  const mod = await import('../routes/guest');
  const { Hono } = await import('hono');
  const { cors } = await import('hono/cors');
  const hono = new Hono();
  hono.use('/*', cors());
  hono.route('/guest', mod.default);
  app = hono;
});

describe('Guest API', () => {
  it('GET /guest/event-types returns all event types', async () => {
    const res = await app.request('/guest/event-types');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('durationMinutes');
  });

  it('GET /guest/event-types/:id/slots returns slots for 30-min event type', async () => {
    const res = await app.request(`/guest/event-types/${et1.id}/slots`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('start');
    expect(body[0]).toHaveProperty('end');
    const dur = new Date(body[0].end).getTime() - new Date(body[0].start).getTime();
    expect(dur).toBe(30 * 60 * 1000);
  });

  it('GET /guest/event-types/:id/slots returns slots for 15-min event type', async () => {
    const res = await app.request(`/guest/event-types/${et2.id}/slots`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
    const dur = new Date(body[0].end).getTime() - new Date(body[0].start).getTime();
    expect(dur).toBe(15 * 60 * 1000);
  });

  it('GET /guest/event-types/:id/slots returns 404 for unknown id', async () => {
    const res = await app.request('/guest/event-types/999/slots');
    expect(res.status).toBe(404);
  });

  it('POST /guest/bookings creates a booking', async () => {
    const slot = insertedSlots[0];
    const end = new Date(new Date(slot.start).getTime() + et1.durationMinutes * 60 * 1000).toISOString();
    const payload = {
      guestEmail: 'test@example.com',
      slot: { id: slot.id, start: slot.start, end },
      eventType: { id: et1.id, name: et1.name, description: et1.description, durationMinutes: et1.durationMinutes },
    };
    const res = await app.request('/guest/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.guestEmail).toBe('test@example.com');
  });

  it('POST /guest/bookings rejects already booked slot', async () => {
    const slot = insertedSlots[2];
    const end = new Date(new Date(slot.start).getTime() + et1.durationMinutes * 60 * 1000).toISOString();
    const payload = {
      guestEmail: 'first@example.com',
      slot: { id: slot.id, start: slot.start, end },
      eventType: { id: et1.id, name: et1.name, description: et1.description, durationMinutes: et1.durationMinutes },
    };
    const res1 = await app.request('/guest/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request('/guest/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res2.status).toBe(409);
  });

  it('15-min booking blocks overlapping 30-min slot for another event type', async () => {
    const slot = insertedSlots[4];
    const end = new Date(new Date(slot.start).getTime() + et2.durationMinutes * 60 * 1000).toISOString();
    const payload = {
      guestEmail: 'cross@example.com',
      slot: { id: slot.id, start: slot.start, end },
      eventType: { id: et2.id, name: et2.name, description: et2.description, durationMinutes: et2.durationMinutes },
    };
    const bookingRes = await app.request('/guest/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(bookingRes.status).toBe(200);

    const slotsRes = await app.request(`/guest/event-types/${et1.id}/slots`);
    const slots = await slotsRes.json();
    const blocked = slots.find((s: any) => s.start === slot.start);
    expect(blocked).toBeUndefined();
  });
});
