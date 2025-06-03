export interface Venue {
  venue_id: number;
  venue_name: string;
  asset_status_id: number;
  description: string | null;
  location: string | null;
  capacity: number | null;
  equipments: string[];
  image_url?: string | null;
  // UI-only properties (not in database)
  images?: string[];
}

export interface CreateVenueDTO {
  venue_name: string;
  asset_status_id: number;
  description?: string | null;
  location?: string | null;
  capacity?: number | null;
  equipments?: string[];
  image_url?: string | null;
}

export interface UpdateVenueDTO extends Partial<CreateVenueDTO> {
  venue_id: number;
}
