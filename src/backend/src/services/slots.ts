export interface SlotInput {
  start: string;
  end: string;
}

export function generateSlots(
  days: number,
): SlotInput[] {
  const slots: SlotInput[] = [];
  const now = new Date();
  const startHour = 9;
  const endHour = 18;
  const stepMs = 15 * 60 * 1000;

  for (let i = 0; i < days; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);
    day.setHours(0, 0, 0, 0);

    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue;

    const dayStart = new Date(day);
    dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(endHour, 0, 0, 0);

    for (let t = dayStart.getTime(); t + stepMs <= dayEnd.getTime(); t += stepMs) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t + stepMs);
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }
  }

  return slots;
}

export function getAvailableSlots(
  atomicSlots: { id: number; start: string; end: string }[],
  durationMinutes: number,
): { id: number; start: string; end: string }[] {
  const slotsNeeded = durationMinutes / 15;
  const result: { id: number; start: string; end: string }[] = [];

  for (let i = 0; i <= atomicSlots.length - slotsNeeded; i++) {
    let consecutive = true;
    for (let j = 0; j < slotsNeeded - 1; j++) {
      if (atomicSlots[i + j].end !== atomicSlots[i + j + 1].start) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) {
      result.push({
        id: atomicSlots[i].id,
        start: atomicSlots[i].start,
        end: atomicSlots[i + slotsNeeded - 1].end,
      });
    }
  }

  return result;
}
