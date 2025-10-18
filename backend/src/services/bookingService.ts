import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getFirestore } from "../config/firebase";
import { Booking, CreateBookingInput } from "../models/booking";
import { HttpError } from "../utils/httpError";

const BOOKINGS_COLLECTION = "bookings";

type BookingDocument = CreateBookingInput & { createdAt: string };

export const createBooking = async (
  payload: CreateBookingInput
): Promise<Booking> => {
  const db = getFirestore();

  const existingSnapshot = await db
    .collection(BOOKINGS_COLLECTION)
    .where("service", "==", payload.service)
    .where("date", "==", payload.date)
    .where("time", "==", payload.time)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
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

export const deleteBooking = async (id: string): Promise<void> => {
  const db = getFirestore();
  const docRef = db.collection(BOOKINGS_COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpError(404, "El turno solicitado no existe.");
  }

  await docRef.delete();
};
