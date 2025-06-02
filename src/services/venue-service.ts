import { supabase } from '@/supabase-client';
import { Venue, CreateVenueDTO, UpdateVenueDTO } from '@/types/venue';

export const venueService = {
  // Get all venues
  async getVenues(): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venue')
      .select('*')
      .order('name');

    if (error) {
      // Error fetching venues
      throw error;
    }

    return data || [];
  },

  // Get a single venue by ID
  async getVenueById(id: string): Promise<Venue | null> {
    const { data, error } = await supabase
      .from('venue')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Error fetching venue
      throw error;
    }

    return data;
  },

  // Create a new venue
  async createVenue(venueData: CreateVenueDTO): Promise<Venue> {
    const { data, error } = await supabase
      .from('venue')
      .insert({
        ...venueData,
        amenities: venueData.amenities || [],
        status: venueData.status || 'available',
      })
      .select()
      .single();

    if (error) {
      // Error creating venue
      throw error;
    }

    return data;
  },

  // Update an existing venue
  async updateVenue({ id, ...updates }: UpdateVenueDTO): Promise<Venue> {
    const { data, error } = await supabase
      .from('venue')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Error updating venue
      throw error;
    }

    return data;
  },

  // Delete a venue
  async deleteVenue(id: string): Promise<void> {
    const { error } = await supabase
      .from('venue')
      .delete()
      .eq('id', id);

    if (error) {
      // Error deleting venue
      throw error;
    }
  },

  // Subscribe to venue changes
  subscribeToVenues(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('public:venues')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'venue',
        },
        (payload) => callback(payload)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
