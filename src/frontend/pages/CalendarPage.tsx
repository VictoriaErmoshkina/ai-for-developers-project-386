import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';
import { guestApi } from '@/api/client';
import type { Slot, EventType } from '@/types/api';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { Input } from '@/components/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/dialog';
import { cn } from '@/lib/utils';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function toDateKey(iso: string) {
  return iso.slice(0, 10);
}

function get14Days(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

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
  const todayKey = toDateKey(new Date().toISOString());
  const slotsForSelectedDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  function handleSubmit() {
    if (!selectedSlot || !eventType) return;
    guestApi.createBooking({ id: 0, guestEmail: email, slot: selectedSlot, eventType });
    setSubmitted(true);
    setTimeout(() => {
      setSelectedSlot(null);
      setSubmitted(false);
      setEmail('');
    }, 2000);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setSelectedSlot(null);
      setSubmitted(false);
      setEmail('');
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="size-4" />
            Назад
          </Button>

          {eventType && (
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {eventType.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="gap-1 text-primary bg-primary/10 border-primary/20 hover:bg-primary/10"
                >
                  <Clock className="size-3" />
                  {eventType.durationMinutes} мин
                </Badge>
                <span className="text-sm text-muted-foreground">{eventType.description}</span>
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Выберите дату
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const key = toDateKey(day.toISOString());
              const hasSlots = Boolean(slotsByDate[key]?.length);
              const isSelected = selectedDate === key;
              const isToday = key === todayKey;

              return (
                <button
                  key={key}
                  disabled={!hasSlots}
                  onClick={() => setSelectedDate(key)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl py-2.5 px-1 text-center text-xs transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : hasSlots
                        ? 'bg-secondary text-secondary-foreground hover:border hover:border-primary hover:text-primary cursor-pointer'
                        : 'text-muted-foreground/30 cursor-not-allowed'
                  )}
                >
                  <span className="text-[10px] font-medium uppercase opacity-70">
                    {day.toLocaleDateString('ru-RU', { weekday: 'short' })}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      isToday && !isSelected && 'text-primary'
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {hasSlots && !isSelected && (
                    <span className="size-1 rounded-full bg-primary/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots */}
        {selectedDate && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Свободное время · {formatDateLong(selectedDate + 'T12:00:00')}
            </p>
            {slotsForSelectedDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет доступных слотов на этот день</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slotsForSelectedDate.map((slot) => (
                  <Button
                    key={slot.id}
                    variant="outline"
                    size="sm"
                    className="hover:border-primary hover:text-primary"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {formatTime(slot.start)} – {formatTime(slot.end)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking dialog */}
      <Dialog open={!!selectedSlot} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-sm">
          {!submitted ? (
            <>
              <DialogHeader>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                  Подтверждение записи
                </p>
                <DialogTitle>{eventType?.name}</DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-0">
                    {selectedSlot && (
                      <div className="mt-3 rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Clock className="size-3.5 text-primary" />
                          {formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5 text-primary" />
                          {formatDateLong(selectedSlot.start)}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Ваш email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && email && handleSubmit()}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1">
                    Отмена
                  </Button>
                </DialogClose>
                <Button
                  className="flex-1"
                  disabled={!email}
                  onClick={handleSubmit}
                >
                  Записаться →
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-10 text-primary" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Запись создана!</p>
                <p className="text-sm text-muted-foreground">
                  Подтверждение придёт на {email}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}