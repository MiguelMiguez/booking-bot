import { request } from "./apiClient";
import type { Booking, NewBooking } from "../types";

const RESOURCE = "/bookings";

export const fetchBookings = async (): Promise<Booking[]> => {
  return request<Booking[]>(RESOURCE);
};

export const createBooking = async (payload: NewBooking): Promise<Booking> => {
  return request<Booking, NewBooking>(RESOURCE, {
    method: "POST",
    body: payload,
  });
};

export const deleteBooking = async (id: string): Promise<void> => {
  await request<void>(`${RESOURCE}/${id}`, { method: "DELETE" });
};
