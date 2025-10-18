import {
  Timestamp,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { NewService, Service } from "../types";

const COLLECTION_NAME = "services";

const servicesCollection = collection(db, COLLECTION_NAME);

const parseService = (doc: QueryDocumentSnapshot<DocumentData>): Service => {
  const data = doc.data();

  return {
    id: doc.id,
    name: String(data.name ?? ""),
    duration: Number(data.duration ?? 0),
    price:
      data.price !== undefined && data.price !== null
        ? Number(data.price)
        : undefined,
  };
};

export const subscribeToServices = (
  onUpdate: (items: Service[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const servicesQuery = query(servicesCollection, orderBy("name", "asc"));

  return onSnapshot(
    servicesQuery,
    (snapshot) => {
      const items = snapshot.docs.map(parseService);
      onUpdate(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

export const createService = async (payload: NewService): Promise<Service> => {
  const trimmedPayload: NewService = {
    name: payload.name.trim(),
    duration: Number(payload.duration),
    price:
      payload.price !== undefined && payload.price !== null
        ? Number(payload.price)
        : undefined,
  };

  if (
    !Number.isFinite(trimmedPayload.duration) ||
    trimmedPayload.duration <= 0
  ) {
    throw new Error("La duración debe ser un número mayor a 0.");
  }

  const document = {
    ...trimmedPayload,
    createdAt: Timestamp.now(),
  } satisfies Omit<Service, "id"> & { createdAt: Timestamp };

  const docRef = await addDoc(servicesCollection, document);

  return {
    id: docRef.id,
    ...trimmedPayload,
  };
};
