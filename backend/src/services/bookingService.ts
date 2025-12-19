import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getFirestore } from "../config/firebase";
import { Booking, CreateBookingInput } from "../models/booking";
import { HttpError } from "../utils/httpError";

const BOOKINGS_COLLECTION = "bookings";

const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 19;
const SLOT_INTERVAL_MINUTES = 30;

type BookingDocument = CreateBookingInput & { createdAt: string };

const pad = (value: number): string => value.toString().padStart(2, "0");

const generateDailySlots = (intervalMinutes: number): string[] => {
  const slots: string[] = [];
  const startMinutes = BUSINESS_START_HOUR * 60;
  const endMinutes = BUSINESS_END_HOUR * 60;

  for (
    let minutes = startMinutes;
    minutes <= endMinutes;
    minutes += intervalMinutes
  ) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    slots.push(`${pad(hours)}:${pad(remainder)}`);
  }

  return slots;
};

export const isWithinBusinessHours = (time: string): boolean => {
  const [hourStr, minuteStr] = time.split(":");
  if (!hourStr || !minuteStr) {
    return false;
  }

  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return false;
  }

  if (minute < 0 || minute >= 60) {
    return false;
  }

  if (hour < BUSINESS_START_HOUR) {
    return false;
  }

  if (hour > BUSINESS_END_HOUR) {
    return false;
  }

  if (hour === BUSINESS_END_HOUR && minute > 0) {
    return false;
  }

  return true;
};

const isSlotTaken = async (
  date: string,
  time: string,
  service?: string
): Promise<boolean> => {
  const db = getFirestore();

  let query: Query = db.collection(BOOKINGS_COLLECTION);

  if (service) {
    query = query.where("service", "==", service);
  }

  query = query.where("date", "==", date).where("time", "==", time);

  const snapshot = await query.limit(1).get();
  return !snapshot.empty;
};

export const isSlotAvailable = async (
  date: string,
  time: string,
  service?: string
): Promise<boolean> => {
  if (!isWithinBusinessHours(time)) {
    return false;
  }

  return !(await isSlotTaken(date, time, service));
};

export const suggestAvailableSlots = async (
  date: string,
  service: string,
  limit = 3
): Promise<string[]> => {
  const db = getFirestore();
  let query: Query = db
    .collection(BOOKINGS_COLLECTION)
    .where("date", "==", date);

  if (service) {
    query = query.where("service", "==", service);
  }

  const snapshot = await query.get();
  const taken = new Set(
    snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as BookingDocument;
      return data.time;
    })
  );

  const slots = generateDailySlots(SLOT_INTERVAL_MINUTES);
  const suggestions: string[] = [];

  for (const slot of slots) {
    if (!taken.has(slot)) {
      suggestions.push(slot);
    }

    if (suggestions.length >= limit) {
      break;
    }
  }

  return suggestions;
};

export const createBooking = async (
  payload: CreateBookingInput
): Promise<Booking> => {
  if (!isWithinBusinessHours(payload.time)) {
    throw new HttpError(400, "Los turnos disponibles son de 09:00 a 19:00.");
  }

  const db = getFirestore();

  const slotTaken = await isSlotTaken(
    payload.date,
    payload.time,
    payload.service
  );

  if (slotTaken) {
    throw new HttpError(409, "El horario ya no está disponible.");
  }

  const bookingDocument: BookingDocument = {
    ...payload,
    createdAt: new Date().toISOString(),
  };

  const docRef = await db.collection(BOOKINGS_COLLECTION).add(bookingDocument);

  return {
    id: docRef.id,
    ...bookingDocument,
  };
};

export const listBookings = async (): Promise<Booking[]> => {
  const db = getFirestore();
  const snapshot = await db
    .collection(BOOKINGS_COLLECTION)
    .orderBy("date")
    .orderBy("time")
    .get();

  return snapshot.docs.map(
    (doc: QueryDocumentSnapshot): Booking => ({
      id: doc.id,
      ...(doc.data() as BookingDocument),
    })
  );
};

export const updateBooking = async (
  id: string,
  payload: Partial<CreateBookingInput>
): Promise<Booking> => {
  const db = getFirestore();
  const docRef = db.collection(BOOKINGS_COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpError(404, "El turno solicitado no existe.");
  }

  const currentData = doc.data() as BookingDocument;

  const newDate = payload.date ?? currentData.date;
  const newTime = payload.time ?? currentData.time;
  const newService = payload.service ?? currentData.service;

  if (payload.time && !isWithinBusinessHours(newTime)) {
    throw new HttpError(400, "Los turnos disponibles son de 09:00 a 19:00.");
  }

  if (payload.date || payload.time || payload.service) {
    const slotTaken = await isSlotTaken(newDate, newTime, newService);
    if (slotTaken) {
      const existingBooking = await db
        .collection(BOOKINGS_COLLECTION)
        .where("date", "==", newDate)
        .where("time", "==", newTime)
        .where("service", "==", newService)
        .limit(1)
        .get();

      const conflictingDoc = existingBooking.docs[0];
      if (conflictingDoc && conflictingDoc.id !== id) {
        throw new HttpError(409, "El horario ya no está disponible.");
      }
    }
  }

  const updateData: Partial<BookingDocument> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.service !== undefined) updateData.service = payload.service;
  if (payload.date !== undefined) updateData.date = payload.date;
  if (payload.time !== undefined) updateData.time = payload.time;
  if (payload.phone !== undefined) updateData.phone = payload.phone;

  await docRef.update(updateData);

  const updatedDoc = await docRef.get();
  return {
    id: updatedDoc.id,
    ...(updatedDoc.data() as BookingDocument),
  };
};

export const deleteBooking = async (id: string): Promise<void> => {
  const db = getFirestore();
  const docRef = db.collection(BOOKINGS_COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpError(404, "El turno solicitado no existe.");
  }

  await docRef.delete();
};
