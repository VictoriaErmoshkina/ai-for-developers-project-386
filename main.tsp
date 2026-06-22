import "@typespec/http";

using Http;
@service(#{ title: "Calendar Service" })
namespace DemoService;

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
  op createEventType(@body body: EventType): EventType;

  @route("/bookings")
  @get
  op listBookings(): Booking[];
}

@route("/guest")
namespace GuestApi {
  @route("/event-types")
  @get
  op listEventTypes(): EventType[];

  @route("/event-types/{eventTypeId}/slots")
  @get
  op getAvailableSlots(@path eventTypeId: string): Slot[];

  @route("/bookings")
  @post
  op createBooking(@body body: Booking): Booking;
}
