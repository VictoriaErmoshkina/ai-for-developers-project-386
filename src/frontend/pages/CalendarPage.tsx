import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestApi } from '@/api/client';
import type { Slot, EventType } from '@/types/api';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}

function toDateKey(iso: string) {
  return iso.slice(0, 10);
}

function get14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
} as const;

export default function CalendarPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!eventTypeId) return;
    guestApi.getSlots(eventTypeId).then(setSlots);
    guestApi.listEventTypes().then((types) => {
      const found = types.find((t) => String(t.id) === eventTypeId);
      if (found) setEventType(found);
    });
  }, [eventTypeId]);

  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = toDateKey(slot.start);
    (acc[key] ??= []).push(slot);
    return acc;
  }, {});

  const days = get14Days();
  const slotsForSelectedDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  function handleSubmit() {
    if (!selectedSlot || !eventType) return;
    guestApi.createBooking({ id: 0, guestEmail: email, slot: selectedSlot, eventType });
    setSubmitted(true);
    setTimeout(() => {
      setSelectedSlot(null);
      setSubmitted(false);
      setEmail('');
    }, 1500);
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm transition-colors duration-200"
            style={{ color: '#555' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f0f0f0')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#555')}
          >
            ← Назад
          </button>

          {eventType && (
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {eventType.name}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.2)',
                    color: '#a78bfa',
                    border: '1px solid rgba(124,58,237,0.3)',
                  }}
                >
                  {eventType.durationMinutes} мин
                </span>
                <span className="text-sm" style={{ color: '#666' }}>
                  {eventType.description}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Calendar grid */}
        <div className="rounded-2xl p-5 space-y-4" style={glass}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#555' }}>
            Выберите дату
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const key = toDateKey(day.toISOString());
              const hasSlots = Boolean(slotsByDate[key]?.length);
              const isSelected = selectedDate === key;
              const isToday = key === toDateKey(new Date().toISOString());

              const dayNum = day.toLocaleDateString('ru-RU', { day: 'numeric' });
              const dayName = day.toLocaleDateString('ru-RU', { weekday: 'short' });

              return (
                <button
                  key={key}
                  disabled={!hasSlots}
                  onClick={() => setSelectedDate(key)}
                  className="rounded-xl p-2 text-center transition-all duration-200 flex flex-col items-center gap-0.5"
                  style={
                    isSelected
                      ? {
                          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                          color: '#fff',
                          border: '1px solid transparent',
                        }
                      : hasSlots
                      ? {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: isToday ? '#a78bfa' : '#e0e0e0',
                          cursor: 'pointer',
                        }
                      : {
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.04)',
                          color: '#333',
                          cursor: 'not-allowed',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!hasSlots || isSelected) return;
                    (e.currentTarget as HTMLElement).style.border = '1px solid rgba(124,58,237,0.5)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (!hasSlots || isSelected) return;
                    (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.1)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  }}
                >
                  <span className="text-[10px] font-medium uppercase opacity-70">{dayName}</span>
                  <span className="text-sm font-semibold">{dayNum}</span>
                  {hasSlots && !isSelected && (
                    <span
                      className="w-1 h-1 rounded-full mt-0.5"
                      style={{ background: '#7c3aed' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots */}
        {selectedDate && (
          <div className="rounded-2xl p-5 space-y-4" style={glass}>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#555' }}>
              Свободное время · {formatDate(selectedDate + 'T00:00:00')}
            </p>
            {slotsForSelectedDate.length === 0 ? (
              <p className="text-sm" style={{ color: '#555' }}>Нет доступных слотов на этот день</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slotsForSelectedDate.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e0e0e0',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.3))';
                      (e.currentTarget as HTMLElement).style.border = '1px solid rgba(124,58,237,0.5)';
                      (e.currentTarget as HTMLElement).style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.1)';
                      (e.currentTarget as HTMLElement).style.color = '#e0e0e0';
                    }}
                  >
                    {formatTime(slot.start)} – {formatTime(slot.end)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking modal */}
      {selectedSlot && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedSlot(null); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-5"
            style={{
              background: 'rgba(18,18,18,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 60px rgba(124,58,237,0.2), 0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal header */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#7c3aed' }}>
                  Подтверждение записи
                </p>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="text-lg leading-none transition-colors"
                  style={{ color: '#444' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#fff')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#444')}
                >
                  ×
                </button>
              </div>
              <h2 className="text-lg font-bold text-white">
                {eventType?.name}
              </h2>
            </div>

            {/* Time info */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: '#7c3aed' }}>◷</span>
                <span className="text-sm font-semibold text-white">
                  {formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#7c3aed' }}>◈</span>
                <span className="text-sm" style={{ color: '#888' }}>
                  {formatDate(selectedSlot.start)}
                </span>
              </div>
            </div>

            {!submitted ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium" style={{ color: '#666' }}>
                    Ваш email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f0f0f0',
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLElement).style.border = '1px solid rgba(124,58,237,0.6)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)';
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.1)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                    }}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#888',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.color = '#ccc';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.color = '#888';
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!email}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                      color: '#fff',
                      border: '1px solid transparent',
                    }}
                  >
                    Записаться →
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-2">
                <div
                  className="text-3xl"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.8))' }}
                >
                  ✦
                </div>
                <p className="text-sm font-semibold text-white">Запись создана!</p>
                <p className="text-xs" style={{ color: '#666' }}>
                  Подтверждение придёт на {email}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}