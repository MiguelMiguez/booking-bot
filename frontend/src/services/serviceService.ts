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
