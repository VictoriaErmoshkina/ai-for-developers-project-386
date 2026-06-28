import { describe, it, expect } from 'vitest';
import { generateSlots, getAvailableSlots } from '../services/slots';

describe('generateSlots', () => {
  it('generates 15-min slots (14 days to cover weekends)', () => {
    const slots = generateSlots(14);
    expect(slots.length).toBeGreaterThan(0);
    slots.forEach((s) => {
      expect(s.start).toBeTruthy();
      expect(s.end).toBeTruthy();
    });
  });

  it('each slot is exactly 15 minutes', () => {
    const slots = generateSlots(14);
    slots.forEach((s) => {
      const start = new Date(s.start).getTime();
      const end = new Date(s.end).getTime();
      expect(end - start).toBe(15 * 60 * 1000);
    });
  });

  it('slots are within working hours (09:00-18:00)', () => {
    const slots = generateSlots(14);
    slots.forEach((s) => {
      const startHour = new Date(s.start).getHours();
      const endHour = new Date(s.end).getHours();
      expect(startHour).toBeGreaterThanOrEqual(9);
      expect(endHour).toBeLessThanOrEqual(18);
    });
  });

  it('skips weekends', () => {
    const slots = generateSlots(14);
    slots.forEach((s) => {
      const dow = new Date(s.start).getDay();
      expect(dow).not.toBe(0);
      expect(dow).not.toBe(6);
    });
  });

  it('generates more slots for longer periods', () => {
    const oneDay = generateSlots(1).length;
    const threeDays = generateSlots(3).length;
    expect(threeDays).toBeGreaterThanOrEqual(oneDay);
  });

  it('returns empty array for 0 days', () => {
    const slots = generateSlots(0);
    expect(slots).toHaveLength(0);
  });
});

describe('getAvailableSlots', () => {
  it('groups atomic slots into windows of requested duration', () => {
    const atomicSlots = [
      { id: 1, start: '2026-06-29T09:00:00.000Z', end: '2026-06-29T09:15:00.000Z' },
      { id: 2, start: '2026-06-29T09:15:00.000Z', end: '2026-06-29T09:30:00.000Z' },
      { id: 3, start: '2026-06-29T09:30:00.000Z', end: '2026-06-29T09:45:00.000Z' },
      { id: 4, start: '2026-06-29T09:45:00.000Z', end: '2026-06-29T10:00:00.000Z' },
    ];
    const result = getAvailableSlots(atomicSlots, 30);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 1, start: '2026-06-29T09:00:00.000Z', end: '2026-06-29T09:30:00.000Z' });
    expect(result[1]).toEqual({ id: 2, start: '2026-06-29T09:15:00.000Z', end: '2026-06-29T09:45:00.000Z' });
    expect(result[2]).toEqual({ id: 3, start: '2026-06-29T09:30:00.000Z', end: '2026-06-29T10:00:00.000Z' });
  });

  it('returns empty when not enough consecutive slots', () => {
    const atomicSlots = [
      { id: 1, start: '2026-06-29T09:00:00.000Z', end: '2026-06-29T09:15:00.000Z' },
      { id: 2, start: '2026-06-29T09:30:00.000Z', end: '2026-06-29T09:45:00.000Z' },
    ];
    const result = getAvailableSlots(atomicSlots, 30);
    expect(result).toHaveLength(0);
  });

  it('returns single slot for 15-min duration', () => {
    const atomicSlots = [
      { id: 1, start: '2026-06-29T09:00:00.000Z', end: '2026-06-29T09:15:00.000Z' },
    ];
    const result = getAvailableSlots(atomicSlots, 15);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 1, start: '2026-06-29T09:00:00.000Z', end: '2026-06-29T09:15:00.000Z' });
  });

  it('handles gap in middle of consecutive slots', () => {
    const atomicSlots = [
      { id: 1, start: '2026-06-29T09:00:00.000Z', end: '2026-06-29T09:15:00.000Z' },
      { id: 2, start: '2026-06-29T09:15:00.000Z', end: '2026-06-29T09:30:00.000Z' },
      { id: 3, start: '2026-06-29T10:00:00.000Z', end: '2026-06-29T10:15:00.000Z' },
      { id: 4, start: '2026-06-29T10:15:00.000Z', end: '2026-06-29T10:30:00.000Z' },
    ];
    const result = getAvailableSlots(atomicSlots, 30);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, start: '2026-06-29T09:00:00.000Z', end: '2026-06-29T09:30:00.000Z' });
    expect(result[1]).toEqual({ id: 3, start: '2026-06-29T10:00:00.000Z', end: '2026-06-29T10:30:00.000Z' });
  });
});
