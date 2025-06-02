import { supabase } from '@/supabase-client';
import { Venue, CreateVenueDTO, UpdateVenueDTO } from '@/types/venue';

export const venueService = {
  // Get all venues
  async getVenues(): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venue')
      .select('*')
      .order('venue_name');

    if (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }

    return data || [];
  },

  // Get a single venue by ID
  async getVenueById(id: number): Promise<Venue | null> {
    const { data, error } = await supabase
      .from('venue')
      .select('*')
      .eq('venue_id', id)
      .single();

    if (error) {
      console.error(`Error fetching venue ${id}:`, error);
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
        equipments: venueData.equipments || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating venue:', error);
      throw error;
    }

    return data;
  },

  // Update an existing venue
  async updateVenue({ venue_id, ...updates }: UpdateVenueDTO): Promise<Venue> {
    const { data, error } = await supabase
      .from('venue')
      .update({
        ...updates
      })
      .eq('venue_id', venue_id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating venue ${venue_id}:`, error);
      throw error;
    }

    return data;
  },

  // Delete a venue
  async deleteVenue(id: number): Promise<void> {
    const { error } = await supabase
      .from('venue')
      .delete()
      .eq('venue_id', id);

    if (error) {
      console.error(`Error deleting venue ${id}:`, error);
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
