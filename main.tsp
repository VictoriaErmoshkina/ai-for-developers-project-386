import "@typespec/http";

using Http;
@service(#{ title: "Calendar Service" })
namespace DemoService;

@example(#{
  id: 1,
  name: "Консультация",
  description: "Разбираем вашу задачу и намечаем план",
  durationMinutes: 30
})
@example(#{
  id: 2,
  name: "Короткий синк",
  description: "Решаем вопросики и синхронихируем дальнейший план",
  durationMinutes: 15
})
model EventType {
  id: int32;
  name: string;
  description: string;
  durationMinutes: int32;
}

model Slot {
  id: int32;
  start: string;
  end: string;
}

model Booking {
  id: int32;
  guestEmail: string;
  slot: Slot;
  eventType: EventType;
}

@route("/host")
namespace HostApi {
  @route("/event-types")
  @post
  @opExample(#{
    parameters: #{
      body: #{
        id: 1,
        name: "Консультация",
        description: "Разбираем вашу задачу и намечаем план",
        durationMinutes: 30
      }
    },
    returnType: #{
      id: 3,
      name: "Консультация",
      description: "Разбираем вашу задачу и намечаем план",
      durationMinutes: 30
    }
  })
  op createEventType(@body body: EventType): EventType;

  @route("/bookings")
  @get
  @opExample(#{
    returnType: #[
      #{
        id: 1,
        guestEmail: "guest@example.com",
        slot: #{ id: 1, start: "2026-06-27T10:00:00Z", end: "2026-06-27T10:30:00Z" },
        eventType: #{ id: 1, name: "Консультация", description: "Разбираем вашу задачу и намечаем план", durationMinutes: 30 }
      }
    ]
  })
  op listBookings(): Booking[];
}

@route("/guest")
namespace GuestApi {
  @route("/event-types")
  @get
  @opExample(#{
    returnType: #[
      #{
        id: 1,
        name: "Консультация",
        description: "Разбираем вашу задачу и намечаем план",
        durationMinutes: 30
      },
      #{
        id: 2,
        name: "Короткий синк",
        description: "Решаем вопросики и синхронихируем дальнейший план",
        durationMinutes: 15
      }
    ]
  })
  op listEventTypes(): EventType[];

  @route("/event-types/{eventTypeId}/slots")
  @get
  @opExample(#{
    parameters: #{ eventTypeId: "1" },
    returnType: #[
      #{ id: 1, start: "2026-06-27T10:00:00Z", end: "2026-06-27T10:30:00Z" },
      #{ id: 2, start: "2026-06-27T11:00:00Z", end: "2026-06-27T11:30:00Z" }
    ]
  })
  op getAvailableSlots(@path eventTypeId: string): Slot[];

  @route("/bookings")
  @post
  @opExample(#{
    parameters: #{
      body: #{
        id: 1,
        guestEmail: "guest@example.com",
        slot: #{ id: 1, start: "2026-06-27T10:00:00Z", end: "2026-06-27T10:30:00Z" },
        eventType: #{ id: 1, name: "Консультация", description: "Разбираем вашу задачу и намечаем план", durationMinutes: 30 }
      }
    },
    returnType: #{
      id: 1,
      guestEmail: "guest@example.com",
      slot: #{ id: 1, start: "2026-06-27T10:00:00Z", end: "2026-06-27T10:30:00Z" },
      eventType: #{ id: 1, name: "Консультация", description: "Разбираем вашу задачу и намечаем план", durationMinutes: 30 }
    }
  })
  op createBooking(@body body: Booking): Booking;
}
