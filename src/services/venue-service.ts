import { supabase } from '@/supabase-client';
import { Venue, CreateVenueDTO, UpdateVenueDTO } from '@/types/venue';
import { v4 as uuidv4 } from 'uuid';

export const venueService = {
  // Get all venues
  async getVenues(): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venue')
      .select('*')
      .order('venue_name');

    if (error) {
      // Error fetching venues
      throw error;
    }

    // Map database column names to our interface
    return data.map(venue => ({
      venue_id: venue.venue_id,
      venue_name: venue.venue_name,
      asset_status_id: venue.asset_status_id,
      description: venue.venue_desc,
      location: venue.venue_loc,
      capacity: venue.venue_cap,
      equipments: venue.venue_feat || [],
      image_url: venue.image_url
    })) || [];
  },

  // Get a single venue by ID
  async getVenueById(id: number): Promise<Venue | null> {
    const { data, error } = await supabase
      .from('venue')
      .select('*')
      .eq('venue_id', id)
      .single();

    if (error) {
      // Error fetching venue
      throw error;
    }

    if (!data) return null;

    // Map database column names to our interface
    return {
      venue_id: data.venue_id,
      venue_name: data.venue_name,
      asset_status_id: data.asset_status_id,
      description: data.venue_desc,
      location: data.venue_loc,
      capacity: data.venue_cap,
      equipments: data.venue_feat || [],
      image_url: data.image_url
    };
  },

  // Create a new venue with image upload support
  async createVenue(venueData: CreateVenueDTO, imageFile?: File): Promise<Venue> {
    let imageUrl = null;
    
    // Upload image if provided
    if (imageFile) {
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('venue_images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          });
          
        if (uploadError) {
          console.error('Error uploading venue image:', uploadError);
          throw uploadError;
        }
        
        // Create a signed URL that works even if the bucket is private
        const { data } = await supabase.storage
          .from('venue_images')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry
        
        imageUrl = data.signedUrl;
      } catch (uploadError) {
        console.error('Error in image upload process:', uploadError);
        throw uploadError;
      }
    }
    
    // Map the DTO fields to database column names
    const venueDbData = {
      venue_name: venueData.venue_name,
      asset_status_id: venueData.asset_status_id,
      venue_desc: venueData.description || null,
      venue_loc: venueData.location || null,
      venue_cap: venueData.capacity || null,
      venue_feat: venueData.equipments || [],
      image_url: imageUrl || venueData.image_url
    };
    
    // Insert venue with image URL if available
    const { data, error } = await supabase
      .from('venue')
      .insert(venueDbData)
      .select()
      .single();

    if (error) {
      // Error creating venue
      throw error;
    }

    // Map the database response back to our Venue interface
    return {
      venue_id: data.venue_id,
      venue_name: data.venue_name,
      asset_status_id: data.asset_status_id,
      description: data.venue_desc,
      location: data.venue_loc,
      capacity: data.venue_cap,
      equipments: data.venue_feat || [],
      image_url: data.image_url
    };
  },
  
  // Upload a venue image
  async uploadVenueImage(imageFile: File): Promise<string> {
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('venue_images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });
        
      if (uploadError) {
        console.error('Error uploading venue image:', uploadError);
        throw uploadError;
      }
      
      // Create a signed URL that works even if the bucket is private
      const { data: { signedUrl } } = await supabase.storage
        .from('venue_images')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry
        
      return signedUrl;
    } catch (error) {
      console.error('Error in image upload process:', error);
      throw error;
    }
  },
  
  // Delete a venue image
  async deleteVenueImage(imageUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const filePathMatch = imageUrl.match(/venue_images\/(.*)/); 
      if (!filePathMatch || !filePathMatch[1]) {
        throw new Error('Invalid image URL format');
      }
      
      const filePath = filePathMatch[1];
      
      const { error } = await supabase.storage
        .from('venue_images')
        .remove([filePath]);
        
      if (error) {
        console.error('Error deleting venue image:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in image deletion process:', error);
      throw error;
    }
  },

  // Update an existing venue with image support
  async updateVenue({ venue_id, ...updates }: UpdateVenueDTO, imageFile?: File): Promise<Venue> {
    console.log('[updateVenue] Received updates DTO:', JSON.stringify(updates, null, 2));
    console.log('[updateVenue] Received imageFile:', imageFile ? imageFile.name : 'No image file');
    console.log('[updateVenue] Initial updates.image_url:', updates.image_url);

    let imageUrlToUpdateInDb = updates.image_url; // Default to what's passed in updates DTO

    let currentDbImageUrl: string | null = null;
    try {
      const { data: existingVenueData, error: fetchError } = await supabase
        .from('venue')
        .select('image_url')
        .eq('venue_id', venue_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[updateVenue] Error fetching existing venue data:', fetchError);
      } else if (existingVenueData) {
        currentDbImageUrl = existingVenueData.image_url;
        console.log('[updateVenue] Fetched currentDbImageUrl:', currentDbImageUrl);
      }
    } catch (e) {
      console.error('[updateVenue] Exception fetching existing venue data:', e);
    }

    if (imageFile) {
      console.log('[updateVenue] Processing new imageFile.');
      if (currentDbImageUrl) {
        console.log('[updateVenue] Attempting to delete old image from storage:', currentDbImageUrl);
        try {
          await this.deleteVenueImage(currentDbImageUrl);
        } catch (deleteError) {
          console.warn('[updateVenue] Could not delete previous venue image during replacement:', deleteError);
        }
      }
      try {
        imageUrlToUpdateInDb = await this.uploadVenueImage(imageFile);
        console.log('[updateVenue] New image uploaded. imageUrlToUpdateInDb:', imageUrlToUpdateInDb);
      } catch (uploadError) {
        console.error('[updateVenue] Error in image upload process during update:', uploadError);
        throw uploadError;
      }
    } else if (updates.image_url === null) {
      console.log('[updateVenue] Explicit image removal requested (updates.image_url is null).');
      if (currentDbImageUrl) {
        console.log('[updateVenue] Attempting to delete old image from storage due to removal:', currentDbImageUrl);
        try {
          await this.deleteVenueImage(currentDbImageUrl);
        } catch (deleteError) {
          console.warn('[updateVenue] Could not delete previous venue image when removing:', deleteError);
        }
      }
      imageUrlToUpdateInDb = null;
    }
    console.log('[updateVenue] Final imageUrlToUpdateInDb before DB data prep:', imageUrlToUpdateInDb);

    const venueDbData: any = {
      venue_name: updates.venue_name,
      asset_status_id: updates.asset_status_id,
      venue_desc: updates.description,
      venue_loc: updates.location,
      venue_cap: updates.capacity,
      venue_feat: updates.equipments, // This is where the issue might be if updates.equipments is wrong
      image_url: imageUrlToUpdateInDb
    };
    console.log('[updateVenue] Prepared venueDbData (before cleaning undefined):', JSON.stringify(venueDbData, null, 2));

    // Create a new object for the final payload to avoid mutating venueDbData if it's used elsewhere
    const finalPayload: any = {};
    Object.keys(venueDbData).forEach(key => {
      if (venueDbData[key] !== undefined) {
        finalPayload[key] = venueDbData[key];
      }
    });
    console.log('[updateVenue] Final payload for Supabase (after cleaning undefined):', JSON.stringify(finalPayload, null, 2));

    const { data, error } = await supabase
      .from('venue')
      .update(finalPayload) // Use the cleaned payload
      .eq('venue_id', venue_id)
      .select()
      .single();

    if (error) {
      console.error(`[updateVenue] Error updating venue ${venue_id}:`, error);
      throw error;
    }

    console.log('[updateVenue] Successfully updated venue. DB response:', data);
    return {
      venue_id: data.venue_id,
      venue_name: data.venue_name,
      asset_status_id: data.asset_status_id,
      description: data.venue_desc,
      location: data.venue_loc,
      capacity: data.venue_cap,
      equipments: data.venue_feat || [],
      image_url: data.image_url
    };
  },

  // Delete a venue
  async deleteVenue(id: number): Promise<void> {
    const { error } = await supabase
      .from('venue')
      .delete()
      .eq('venue_id', id);

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
