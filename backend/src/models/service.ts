export interface CreateServiceInput {
  name: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
}

export interface Service extends CreateServiceInput {
  id: string;
  createdAt: string;
}
