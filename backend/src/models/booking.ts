export interface CreateBookingInput {
  name: string;
  service: string;
  date: string; // Formato esperado: YYYY-MM-DD
  time: string; // Formato esperado: HH:mm
  phone: string;
}

export interface UpdateBookingInput {
  name?: string;
  service?: string;
  date?: string;
  time?: string;
  phone?: string;
}

export interface Booking extends CreateBookingInput {
  id: string;
  createdAt: string;
}
