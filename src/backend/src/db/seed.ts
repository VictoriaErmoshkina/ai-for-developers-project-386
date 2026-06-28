import db, { schema } from './index';
import { generateSlots } from '../services/slots';

const DEFAULT_EVENT_TYPES = [
  { name: 'Консультация', description: 'Разбираем вашу задачу и намечаем план', durationMinutes: 30 },
  { name: 'Короткий синк', description: 'Решаем вопросики и синхронизируем дальнейший план', durationMinutes: 15 },
];

async function seed() {
  const existing = await db.select().from(schema.eventTypes).all();
  if (existing.length > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  for (const et of DEFAULT_EVENT_TYPES) {
    const [eventType] = await db.insert(schema.eventTypes).values(et).returning().all();
    console.log(`Seeded event type "${eventType.name}"`);
  }

  const slotsData = generateSlots(14);
  if (slotsData.length > 0) {
    await db.insert(schema.slots).values(slotsData);
  }
  console.log(`Seeded ${slotsData.length} global 15-min slots`);

  console.log('Seed complete.');
}

seed().catch(console.error);
