export interface Area {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AreasResponse {
  message: string;
  data: Area[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
