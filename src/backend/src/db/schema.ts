import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const eventTypes = sqliteTable('event_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
});

export const slots = sqliteTable('slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  start: text('start').notNull(),
  end: text('end').notNull(),
  isBooked: integer('is_booked').notNull().default(0),
});

export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  guestEmail: text('guest_email').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  eventTypeId: integer('event_type_id').notNull().references(() => eventTypes.id),
});
