export type VenueStatus = 'available' | 'reserved' | 'maintenance';

export interface Venue {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  status: VenueStatus;
  capacity: number | null;
  type: string;
  amenities: string[];
  image_url: string | null;
}

export interface CreateVenueDTO {
  name: string;
  description?: string;
  status?: VenueStatus;
  capacity?: number;
  type: string;
  amenities?: string[];
  image_url?: string;
}

export interface UpdateVenueDTO extends Partial<Omit<CreateVenueDTO, 'id'>> {
  id: string;
}
