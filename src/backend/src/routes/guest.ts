import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, gte, lt } from 'drizzle-orm';
import db, { schema } from '../db';
import { generateSlots, getAvailableSlots } from '../services/slots';
import type { EventType, Slot, Booking } from '@shared/types/api';

const guest = new Hono();

guest.get('/event-types', async (c) => {
  const rows = await db.select().from(schema.eventTypes).all();
  const result: EventType[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    durationMinutes: r.durationMinutes,
  }));
  return c.json(result);
});

guest.get('/event-types/:id/slots', async (c) => {
  const eventTypeId = Number(c.req.param('id'));

  const eventType = await db
    .select()
    .from(schema.eventTypes)
    .where(eq(schema.eventTypes.id, eventTypeId))
    .get();

  if (!eventType) {
    return c.json({ error: 'Event type not found' }, 404);
  }

  const freeAtomicSlots = await db
    .select()
    .from(schema.slots)
    .where(eq(schema.slots.isBooked, 0))
    .orderBy(schema.slots.start)
    .all();

  if (freeAtomicSlots.length < 20) {
    const newSlots = generateSlots(14);
    if (newSlots.length > 0) {
      await db.insert(schema.slots).values(newSlots);
    }
  }

  const updatedFreeSlots = await db
    .select()
    .from(schema.slots)
    .where(eq(schema.slots.isBooked, 0))
    .orderBy(schema.slots.start)
    .all();

  const availableSlots = getAvailableSlots(updatedFreeSlots, eventType.durationMinutes);

  const result: Slot[] = availableSlots.map((s) => ({
    id: s.id,
    start: s.start,
    end: s.end,
  }));

  return c.json(result);
});

const createBookingSchema = z.object({
  id: z.number().int().optional(),
  guestEmail: z.string().email(),
  slot: z.object({
    id: z.number().int(),
    start: z.string(),
    end: z.string(),
  }),
  eventType: z.object({
    id: z.number().int(),
    name: z.string(),
    description: z.string(),
    durationMinutes: z.number().int(),
  }),
});

async function markSlotsInRange(start: string, end: string, booked: boolean) {
  await db
    .update(schema.slots)
    .set({ isBooked: booked ? 1 : 0 })
    .where(
      and(
        gte(schema.slots.start, start),
        lt(schema.slots.start, end),
      ),
    );
}

async function checkSlotsInRange(start: string, end: string, expectedCount: number): Promise<boolean> {
  const slotsInRange = await db
    .select()
    .from(schema.slots)
    .where(
      and(
        gte(schema.slots.start, start),
        lt(schema.slots.start, end),
      ),
    )
    .all();

  return slotsInRange.length === expectedCount && slotsInRange.every((s) => s.isBooked === 0);
}

guest.post('/bookings', zValidator('json', createBookingSchema), async (c) => {
  const body = c.req.valid('json');
  const eventTypeId = body.eventType.id;
  const durationMinutes = body.eventType.durationMinutes;
  const startTime = body.slot.start;
  const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60 * 1000).toISOString();
  const expectedCount = durationMinutes / 15;

  const available = await checkSlotsInRange(startTime, endTime, expectedCount);
  if (!available) {
    return c.json({ error: 'Slot not available' }, 409);
  }

  if (body.id && body.id > 0) {
    const existing = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, body.id))
      .get();

    if (existing) {
      await markSlotsInRange(existing.start, existing.end, false);
      await markSlotsInRange(startTime, endTime, true);

      await db
        .update(schema.bookings)
        .set({
          guestEmail: body.guestEmail,
          start: startTime,
          end: endTime,
        })
        .where(eq(schema.bookings.id, body.id));

      const updated = await db
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.id, body.id))
        .get();

      if (!updated) {
        return c.json({ error: 'Booking not found after update' }, 500);
      }

      return c.json({
        id: updated.id,
        guestEmail: updated.guestEmail,
        slot: { id: body.slot.id, start: startTime, end: endTime },
        eventType: {
          id: eventTypeId,
          name: body.eventType.name,
          description: body.eventType.description,
          durationMinutes,
        },
      } satisfies Booking);
    }
  }

  await markSlotsInRange(startTime, endTime, true);

  const [booking] = await db
    .insert(schema.bookings)
    .values({
      guestEmail: body.guestEmail,
      start: startTime,
      end: endTime,
      eventTypeId,
    })
    .returning()
    .all();

  return c.json({
    id: booking.id,
    guestEmail: booking.guestEmail,
    slot: { id: body.slot.id, start: startTime, end: endTime },
    eventType: {
      id: eventTypeId,
      name: body.eventType.name,
      description: body.eventType.description,
      durationMinutes,
    },
  } satisfies Booking);
});

export default guest;
