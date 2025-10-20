import { request } from "./apiClient";
import type { NewService, Service } from "../types";

const RESOURCE = "/services";

export const fetchServices = async (): Promise<Service[]> => {
  return request<Service[]>(RESOURCE);
};

export const createService = async (payload: NewService): Promise<Service> => {
  return request<Service, NewService>(RESOURCE, {
    method: "POST",
    body: payload,
  });
};

export const updateService = async (
  id: string,
  payload: Partial<NewService>
): Promise<Service> => {
  return request<Service, Partial<NewService>>(`${RESOURCE}/${id}`, {
    method: "PUT",
    body: payload,
  });
};

export const deleteService = async (id: string): Promise<void> => {
  await request<void>(`${RESOURCE}/${id}`, { method: "DELETE" });
};
