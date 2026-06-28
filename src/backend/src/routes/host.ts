import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import db, { schema } from '../db';
import type { EventType, Booking } from '@shared/types/api';

const host = new Hono();

const eventTypeSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().positive(),
});

host.post('/event-types', zValidator('json', eventTypeSchema), async (c) => {
  const body = c.req.valid('json');

  const existing = await db
    .select()
    .from(schema.eventTypes)
    .where(eq(schema.eventTypes.id, body.id))
    .get();

  if (existing) {
    await db
      .update(schema.eventTypes)
      .set({
        name: body.name,
        description: body.description,
        durationMinutes: body.durationMinutes,
      })
      .where(eq(schema.eventTypes.id, body.id));

    const updated = await db
      .select()
      .from(schema.eventTypes)
      .where(eq(schema.eventTypes.id, body.id))
      .get();

    if (!updated) {
      return c.json({ error: 'Event type not found after update' }, 500);
    }

    return c.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      durationMinutes: updated.durationMinutes,
    } satisfies EventType);
  }

  const [eventType] = await db
    .insert(schema.eventTypes)
    .values({
      name: body.name,
      description: body.description,
      durationMinutes: body.durationMinutes,
    })
    .returning()
    .all();

  return c.json({
    id: eventType.id,
    name: eventType.name,
    description: eventType.description,
    durationMinutes: eventType.durationMinutes,
  } satisfies EventType);
});

host.get('/bookings', async (c) => {
  const rows = await db
    .select()
    .from(schema.bookings)
    .leftJoin(schema.eventTypes, eq(schema.bookings.eventTypeId, schema.eventTypes.id))
    .all();

  const result: Booking[] = rows
    .filter((r) => r.event_types)
    .map((r) => ({
      id: r.bookings.id,
      guestEmail: r.bookings.guestEmail,
      slot: {
        id: 0,
        start: r.bookings.start,
        end: r.bookings.end,
      },
      eventType: {
        id: r.event_types!.id,
        name: r.event_types!.name,
        description: r.event_types!.description,
        durationMinutes: r.event_types!.durationMinutes,
      },
    }));

  return c.json(result);
});

export default host;
