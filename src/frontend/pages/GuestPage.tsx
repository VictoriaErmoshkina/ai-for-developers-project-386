import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { guestApi } from '@/api/client';
import type { EventType } from '@/types/api';
import { Card, CardContent } from '@/components/card';
import { Badge } from '@/components/badge';
import { cn } from '@/lib/utils';

export default function GuestPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  useEffect(() => {
    guestApi.listEventTypes().then(setEventTypes);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-md space-y-8">

        <div className="space-y-1.5">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">
            Календарь записи
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Выберите тип встречи
          </h1>
          <p className="text-sm text-muted-foreground">
            Выберите формат — и мы подберём удобное время
          </p>
        </div>

        <div className="space-y-3">
          {eventTypes.map((et) => (
            <Link key={et.id} to={`/calendar/${et.id}`} className="block group">
              <Card
                className={cn(
                  'transition-all duration-150 cursor-pointer',
                  'hover:border-primary hover:shadow-[inset_3px_0_0_0_var(--primary)]'
                )}
              >
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-base font-semibold text-foreground leading-snug">
                      {et.name}
                    </p>
                    <p className="text-sm text-muted-foreground leading-snug truncate">
                      {et.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className="gap-1 text-primary bg-primary/10 border-primary/20 hover:bg-primary/10"
                    >
                      <Clock className="size-3" />
                      {et.durationMinutes} мин
                    </Badge>
                    <ArrowRight
                      className={cn(
                        'size-4 text-muted-foreground/40 transition-transform duration-150',
                        'group-hover:translate-x-0.5 group-hover:text-primary'
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}