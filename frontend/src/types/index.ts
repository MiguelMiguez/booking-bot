export interface Booking {
  id: string;
  name: string;
  service: string;
  date: string;
  time: string;
  phone: string;
  createdAt: string;
}

export type NewBooking = Omit<Booking, "id" | "createdAt">;

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  createdAt: string;
}

export type NewService = Omit<Service, "id" | "createdAt">;
