export interface Equipment {
  equipment_id: number;
  equipment_name: string;
  asset_status_id: number;
  description: string | null;
  location: string | null;
  quantity: number | null;
  image_url?: string | null;
  // UI-only properties (not in database)
  images?: string[];
}

export interface CreateEquipmentDTO {
  equipment_name: string;
  asset_status_id: number;
  description?: string | null;
  location?: string | null;
  quantity?: number | null;
  image_url?: string | null;
}

export interface UpdateEquipmentDTO extends Partial<CreateEquipmentDTO> {
  equipment_id: number;
}
