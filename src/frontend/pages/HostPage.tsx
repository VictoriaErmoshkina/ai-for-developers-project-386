import { useEffect, useState } from 'react';
import { Plus, Mail, CalendarDays, Clock, CalendarOff } from 'lucide-react';
import { hostApi, guestApi } from '@/api/client';
import type { Booking, EventType } from '@shared/types/api';
import { Button } from '@/components/button';
import { Badge } from '@/components/badge';
import { Input } from '@/components/input';
import { Card, CardContent } from '@/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/dialog';


function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });
}

const emptyForm = { id: '', name: '', description: '', durationMinutes: '' };

export default function HostPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [createdTypes, setCreatedTypes] = useState<EventType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    hostApi.listBookings().then(setBookings);
    guestApi.listEventTypes().then(setCreatedTypes);
  }, []);

  const isFormValid =
    form.name.trim() &&
    form.description.trim() &&
    Number.isInteger(Number(form.id)) && form.id !== '' &&
    Number.isInteger(Number(form.durationMinutes)) && form.durationMinutes !== '' &&
    Number(form.durationMinutes) > 0;

  async function handleCreateEventType() {
    if (!isFormValid) return;
    setSubmitting(true);
    const payload: EventType = {
      id: Number(form.id),
      name: form.name.trim(),
      description: form.description.trim(),
      durationMinutes: Number(form.durationMinutes),
    };
    await hostApi.createEventType(payload);
    setCreatedTypes((prev) => [...prev, payload]);
    setForm(emptyForm);
    setDialogOpen(false);
    setSubmitting(false);
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setForm(emptyForm);
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-10">

        {/* Page header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">
            Панель управления
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Хост
          </h1>
        </div>

        {/* Event types section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Типы событий</h2>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Добавить
            </Button>
          </div>

          <hr className="border-border" />

          {createdTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Типы событий ещё не созданы
            </p>
          ) : (
            <div className="space-y-3">
              {createdTypes.map((et) => (
                <Card key={et.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {et.name}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          #{et.id}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {et.description}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 gap-1 text-primary bg-primary/10 border-primary/20 hover:bg-primary/10"
                    >
                      <Clock className="size-3" />
                      {et.durationMinutes} мин
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Bookings section */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Предстоящие встречи</h2>
          <hr className="border-border" />

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <CalendarOff className="size-8 opacity-30" />
              <p className="text-sm">Нет предстоящих встреч</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Card key={b.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {b.eventType.name}
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 gap-1 text-primary bg-primary/10 border-primary/20 hover:bg-primary/10"
                      >
                        <Clock className="size-3" />
                        {b.eventType.durationMinutes} мин
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="size-3.5 shrink-0" />
                        {b.guestEmail}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5 shrink-0" />
                        {formatDateShort(b.slot.start)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3.5 shrink-0" />
                        {formatTime(b.slot.start)} – {formatTime(b.slot.end)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create event type dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              Новый тип события
            </p>
            <DialogTitle>Создать тип события</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">ID</label>
                <Input type="number" placeholder="1" {...field('id')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Длительность (мин)
                </label>
                <Input type="number" placeholder="30" {...field('durationMinutes')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Название</label>
              <Input placeholder="Консультация" {...field('name')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Описание</label>
              <Input placeholder="Разбираем вашу задачу и намечаем план" {...field('description')} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Отмена
              </Button>
            </DialogClose>
            <Button
              className="flex-1"
              disabled={!isFormValid || submitting}
              onClick={handleCreateEventType}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
