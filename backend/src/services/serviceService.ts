import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getFirestore } from "../config/firebase";
import { CreateServiceInput, Service } from "../models/service";
import { HttpError } from "../utils/httpError";

const SERVICES_COLLECTION = "services";

type ServiceDocument = CreateServiceInput & { createdAt: string };

export const listServices = async (): Promise<Service[]> => {
  const db = getFirestore();
  const snapshot = await db
    .collection(SERVICES_COLLECTION)
    .orderBy("name")
    .get();

  return snapshot.docs.map(
    (doc: QueryDocumentSnapshot): Service => ({
      id: doc.id,
      ...(doc.data() as ServiceDocument),
    })
  );
};

export const createService = async (
  payload: CreateServiceInput
): Promise<Service> => {
  if (!payload.name) {
    throw new HttpError(400, "El servicio debe tener un nombre.");
  }

  const db = getFirestore();
  const document: ServiceDocument = {
    ...payload,
    createdAt: new Date().toISOString(),
  };

  const docRef = await db.collection(SERVICES_COLLECTION).add(document);

  return {
    id: docRef.id,
    ...document,
  };
};
