import { supabase } from '@/supabase-client';
import { toast } from 'react-hot-toast';

export const venueService = {
  async getAllVenues() {
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
  
  async getVenueById(venueId) {
    const { data, error } = await supabase
      .from('venue')
      .select('*')
      .eq('venue_id', venueId)
      .single();
    
    if (error) {
      console.error(`Error fetching venue with ID ${venueId}:`, error);
      throw error;
    }
    
    return data;
  },
  
  async createVenue(venueData) {
    const { data, error } = await supabase
      .from('venue')
      .insert([venueData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating venue:', error);
      throw error;
    }
    
    return data;
  },
  
  async updateVenue(venueId, venueData) {
    const { data, error } = await supabase
      .from('venue')
      .update(venueData)
      .eq('venue_id', venueId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating venue with ID ${venueId}:`, error);
      throw error;
    }
    
    return data;
  },
  
  async deleteVenue(venueId) {
    try {
      // First, let's get the cancelled status ID
      const { data: statusData, error: statusError } = await supabase
        .from('reservation_status')
        .select('reservation_status_id')
        .eq('reservation_status', 'Cancelled')
        .single();
        
      if (statusError) {
        console.error('Error finding "Cancelled" status:', statusError);
        throw statusError;
      }
      
      const cancelledStatusId = statusData.reservation_status_id;
      
      // Count and update reservations to be cancelled in one operation
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservation')
        .select('reservation_id')
        .eq('venue_id', venueId);
      
      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError);
        throw reservationsError;
      }
      
      const reservationCount = reservations?.length || 0;
      
      // Update reservation status to cancelled before deletion
      // With our new ON DELETE SET NULL constraint, venue_id will be set to NULL automatically
      if (reservationCount > 0) {
        const { error: updateError } = await supabase
          .from('reservation')
          .update({ reservation_status_id: cancelledStatusId })
          .eq('venue_id', venueId);
        
        if (updateError) {
          console.error('Error updating reservations to cancelled:', updateError);
          throw updateError;
        }
      }
      
      // Now delete the venue - foreign key constraint will set venue_id to NULL in reservations
      const { error: deleteError } = await supabase
        .from('venue')
        .delete()
        .eq('venue_id', venueId);
      
      if (deleteError) {
        console.error(`Error deleting venue:`, deleteError);
        throw deleteError;
      }
      
      return { success: true, reservationsCancelled: reservationCount };
    } catch (error) {
      console.error('Error in deleteVenue:', error);
      throw error;
    }
  }
};
