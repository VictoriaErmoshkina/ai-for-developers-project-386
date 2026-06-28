import type { EventType, Slot, Booking } from '@shared/types/api';

const BASE = 'http://localhost:3001';

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const guestApi = {
  listEventTypes: () =>
    request<EventType[]>('/guest/event-types'),
  getSlots: (id: number) =>
    request<Slot[]>(`/guest/event-types/${id}/slots`),
  createBooking: (body: Booking) =>
    request<Booking>('/guest/bookings', 'POST', body),
};

export const hostApi = {
  listBookings: () =>
    request<Booking[]>('/host/bookings'),
  createEventType: (body: EventType) =>
    request<EventType>('/host/event-types', 'POST', body),
};