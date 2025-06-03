export interface Equipment {
  equipment_id: number;
  equipment_name: string;
  asset_status_id: number;
  equipment_desc: string | null;
  location: string | null;
  image_url?: string | null;
  // UI-only properties (not in database)
  images?: string[];
}

export interface CreateEquipmentDTO {
  equipment_name: string;
  asset_status_id: number;
  equipment_desc?: string | null;
  location?: string | null;
  image_url?: string | null;
}

export interface UpdateEquipmentDTO extends Partial<CreateEquipmentDTO> {
  equipment_id: number;
}
