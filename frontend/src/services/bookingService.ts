import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Booking, NewBooking } from "../types";

const COLLECTION_NAME = "bookings";

const bookingsCollection = collection(db, COLLECTION_NAME);

const parseBooking = (doc: QueryDocumentSnapshot<DocumentData>): Booking => {
  const data = doc.data();

  return {
    id: doc.id,
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
    service: String(data.service ?? ""),
    day: String(data.day ?? ""),
    hour: String(data.hour ?? ""),
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
  };
};

export const subscribeToBookings = (
  onUpdate: (items: Booking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const bookingsQuery = query(bookingsCollection, orderBy("day", "asc"));

  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const items = snapshot.docs.map(parseBooking);
      // Ordenamos también por hora en el cliente para evitar índices compuestos.
      items.sort((a, b) => {
        const left = `${a.day}T${a.hour}`;
        const right = `${b.day}T${b.hour}`;
        return left.localeCompare(right);
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

export const createBooking = async (payload: NewBooking): Promise<Booking> => {
  const trimmedPayload: NewBooking = {
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    service: payload.service.trim(),
    day: payload.day,
    hour: payload.hour,
  };

  const conflictQuery = query(
    bookingsCollection,
    where("service", "==", trimmedPayload.service),
    where("day", "==", trimmedPayload.day),
    where("hour", "==", trimmedPayload.hour)
  );

  const conflictSnapshot = await getDocs(conflictQuery);
  if (!conflictSnapshot.empty) {
    throw new Error("El horario ya está ocupado para ese servicio.");
  }

  const document = {
    ...trimmedPayload,
    createdAt: Timestamp.now(),
  } satisfies Omit<Booking, "id">;

  const docRef = await addDoc(bookingsCollection, document);

  return {
    id: docRef.id,
    ...document,
  };
};
