export interface Slot {
  id: number;
  start: string;
  end: string;
}

export interface EventType {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Booking {
  id: number;
  guestEmail: string;
  slot: Slot;
  eventType: EventType;
}
