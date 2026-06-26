import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { guestApi } from '@/api/client';
import type { EventType } from '@/types/api';

export default function GuestPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  useEffect(() => {
    guestApi.listEventTypes().then(setEventTypes);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-10">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase"
             style={{ color: '#7c3aed' }}>
            Календарь записи
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Выберите тип встречи
          </h1>
          <p className="text-sm" style={{ color: '#888' }}>
            Выберите формат — и мы подберём удобное время
          </p>
        </div>

        <div className="space-y-3">
          {eventTypes.map((et) => (
            <Link key={et.id} to={`/calendar/${et.id}`} className="block group">
              <div
                className="relative rounded-2xl p-5 transition-all duration-300 cursor-pointer overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(124,58,237,0.5)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                {/* Gradient glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{
                    background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.15) 0%, transparent 60%)',
                  }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-white">{et.name}</h2>
                    <p className="text-sm leading-relaxed" style={{ color: '#888' }}>
                      {et.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        background: 'rgba(124,58,237,0.2)',
                        color: '#a78bfa',
                        border: '1px solid rgba(124,58,237,0.3)',
                      }}
                    >
                      {et.durationMinutes} мин
                    </span>
                    <span
                      className="text-xs transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: '#555' }}
                    >
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}