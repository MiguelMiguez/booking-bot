import type { Timestamp } from "firebase/firestore";

export interface Booking {
  id: string;
  name: string;
  phone: string;
  service: string;
  day: string;
  hour: string;
  createdAt: Timestamp;
}

export type NewBooking = Omit<Booking, "id" | "createdAt">;

export interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
}

export type NewService = Omit<Service, "id">;

export type WithId<T extends Record<string, unknown>> = T & { id: string };
