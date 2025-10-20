import type {
  QueryDocumentSnapshot,
  DocumentReference,
} from "firebase-admin/firestore";
import { getFirestore } from "../config/firebase";
import { CreateServiceInput, Service } from "../models/service";
import { HttpError } from "../utils/httpError";

const SERVICES_COLLECTION = "services";

type ServiceDocument = CreateServiceInput & { createdAt: string };

const getCollection = () => getFirestore().collection(SERVICES_COLLECTION);

const getDocumentRef = (id: string): DocumentReference => {
  if (!id) {
    throw new HttpError(
      400,
      "Se requiere un identificador de servicio válido."
    );
  }

  return getCollection().doc(id);
};

const mapSnapshotToService = (doc: QueryDocumentSnapshot): Service => ({
  id: doc.id,
  ...(doc.data() as ServiceDocument),
});

export const listServices = async (): Promise<Service[]> => {
  const snapshot = await getCollection().orderBy("name").get();

  return snapshot.docs.map(mapSnapshotToService);
};

export const createService = async (
  payload: CreateServiceInput
): Promise<Service> => {
  if (!payload.name) {
    throw new HttpError(400, "El servicio debe tener un nombre.");
  }

  const document: ServiceDocument = {
    ...payload,
    createdAt: new Date().toISOString(),
  };

  const docRef = await getCollection().add(document);

  return {
    id: docRef.id,
    ...document,
  };
};

export const updateService = async (
  id: string,
  payload: Partial<CreateServiceInput>
): Promise<Service> => {
  const docRef = getDocumentRef(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpError(404, "El servicio solicitado no existe.");
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, "No se recibieron cambios para actualizar.");
  }

  await docRef.update(payload);
  const updatedDoc = await docRef.get();

  if (!updatedDoc.exists) {
    throw new HttpError(404, "El servicio actualizado no se encontró.");
  }

  return {
    id: updatedDoc.id,
    ...(updatedDoc.data() as ServiceDocument),
  };
};

export const deleteService = async (id: string): Promise<void> => {
  const docRef = getDocumentRef(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpError(404, "El servicio solicitado no existe.");
  }

  await docRef.delete();
};
