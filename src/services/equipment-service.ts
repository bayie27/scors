import { supabase } from '@/supabase-client';
import { Equipment, CreateEquipmentDTO, UpdateEquipmentDTO } from '@/types/equipment';

// Use the same bucket as venues for consistent image handling
const IMAGE_BUCKET = 'venue_images';
// Store the Supabase instance URL for direct public access
const SUPABASE_URL = 'https://ypqlywgargoxrvoersrj.supabase.co';

export const equipmentService = {
  // Helper function to delete an image from Supabase storage
  async deleteEquipmentImage(imageUrl: string | null): Promise<void> {
    if (!imageUrl) {
      // console.log('No image URL provided for deletion.');
      return;
    }

    const storageUrlPrefix = `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/`;
    let filePathToDelete: string | null = null;

    if (imageUrl.startsWith(storageUrlPrefix)) {
      filePathToDelete = imageUrl.substring(storageUrlPrefix.length);
    } else {
      // If it's not a full URL, it might be just a path like 'equipment/filename.jpg'
      // or even just 'filename.jpg' which we prefix with 'equipment/'
      // This part needs to be robust based on how image_url is stored.
      // Assuming if not a full URL, it's a relative path within the 'equipment/' folder in the bucket.
      if (!imageUrl.startsWith('equipment/')) {
        filePathToDelete = `equipment/${imageUrl}`;
      } else {
        filePathToDelete = imageUrl;
      }
      console.log(`Image URL "${imageUrl}" is not a full Supabase storage URL. Assuming relative path: "${filePathToDelete}"`);
    }
    
    if (!filePathToDelete) {
      console.error(`Could not determine file path from URL/path: ${imageUrl}. Aborting deletion.`);
      return;
    }

    console.log(`Attempting to delete image from storage: ${IMAGE_BUCKET}/${filePathToDelete}`);
    try {
      const { error: deleteError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .remove([filePathToDelete]);

      if (deleteError) {
        console.error(`Failed to delete image ${filePathToDelete} from bucket ${IMAGE_BUCKET}:`, deleteError.message);
        // Optionally re-throw or handle as per application needs
      } else {
        console.log(`Successfully deleted image ${filePathToDelete} from bucket ${IMAGE_BUCKET}.`);
      }
    } catch (error) {
        console.error(`Exception during image deletion for ${filePathToDelete}:`, error);
    }
  },

  // Get all equipment
  async getEquipment(): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('asset_status_id', 1) // Only get available equipment
      .order('equipment_name');
    if (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
    return data || [];
  },

  // Get a single equipment by ID
  async getEquipmentById(id: number): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('equipment_id', id)
      .single();
    if (error) {
      // It's common for .single() to error if no row is found. Handle this gracefully.
      if (error.code === 'PGRST116') { // PGRST116: Row not found
        console.log(`Equipment with ID ${id} not found.`);
        return null;
      }
      console.error(`Error fetching equipment ${id}:`, error);
      throw error;
    }
    return data;
  },

  // Upload equipment image
  async uploadEquipmentImage(file: File): Promise<string | null> {
    if (!file) {
      console.log('No file provided to uploadEquipmentImage');
      return null;
    }
    try {
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = `equipment/${timestamp}-${cleanFileName}`;
      
      console.log(`Uploading image to ${IMAGE_BUCKET}/${filePath}`);
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Set to false to avoid overwriting if a file with the exact same path somehow exists
        });

      if (uploadError) {
        console.error('Image upload failed:', uploadError);
        throw uploadError;
      }

      // Return the path, not the full public URL, to be consistent if we store paths
      // The getPublicUrl can be used when displaying the image.
      // However, the current setup seems to store full URLs, so we'll stick to that for now.
      const { data: publicUrlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filePath);
      
      console.log('Image uploaded successfully, public URL:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  },
  
  // Get public URL for an existing image path/URL
  async getPublicImageUrl(imagePathOrUrl: string): Promise<string | null> {
    if (!imagePathOrUrl) return null;
    if (imagePathOrUrl.startsWith('http')) {
      return imagePathOrUrl; // Already a full URL
    }
    // Assume it's a relative path
    let fullPath = imagePathOrUrl;
    if (!fullPath.startsWith('equipment/')) {
        fullPath = `equipment/${fullPath}`;
    }
    try {
      const { data } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(fullPath);
      if (!data || !data.publicUrl) {
        console.warn('Could not generate public URL, image may not exist at path:', fullPath);
        return null;
      }
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public image URL for path:', fullPath, error);
      return null;
    }
  },

  // Create new equipment
  async createEquipment(equipmentData: Omit<CreateEquipmentDTO, 'image_url'>, imageFile?: File): Promise<Equipment> {
    let imageUrlToStore: string | null = null;
    if (imageFile) {
      try {
        imageUrlToStore = await this.uploadEquipmentImage(imageFile);
        console.log('Image uploaded for new equipment:', imageUrlToStore);
      } catch (error) {
        console.error('Failed to upload image during equipment creation:', error);
        // Decide if creation should fail or proceed without image
        // For now, proceed without image if upload fails
      }
    }
    const dataToInsert = { ...equipmentData, image_url: imageUrlToStore };
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert(dataToInsert)
        .select()
        .single();
      if (error) {
        console.error('Database error creating equipment:', error);
        throw error;
      }
      console.log('Equipment created successfully with ID:', data?.equipment_id);
      return data;
    } catch (error) {
      console.error('Error in equipment creation process:', error);
      throw error;
    }
  },
  
  // Helper function to get full image URL (adds cache buster)
  // This might be redundant if getPublicImageUrl is sufficient and components handle cache busting if needed.
  getFullImageUrl(imagePathOrUrl: string | null): string | null {
    if (!imagePathOrUrl) return null;
    if (imagePathOrUrl.startsWith('http')) {
      // Potentially add cache buster to existing full URLs too
      // const url = new URL(imagePathOrUrl);
      // url.searchParams.set('t', Date.now().toString());
      // return url.toString();
      return imagePathOrUrl; // For now, return as is if full URL
    }
    // Assume it's a relative path
    let fullPath = imagePathOrUrl;
    if (!fullPath.startsWith('equipment/')) {
        fullPath = `equipment/${fullPath}`;
    }
    const { data } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(fullPath);
    if (!data?.publicUrl) {
      console.error('Failed to generate public URL for', fullPath);
      return null;
    }
    const cacheBuster = `?t=${Date.now()}`;
    return `${data.publicUrl}${cacheBuster}`;
  },

  // Update an existing equipment
  async updateEquipment({ equipment_id, ...updates }: UpdateEquipmentDTO, imageFile?: File): Promise<Equipment> {
    try {
      const currentEquipment = await this.getEquipmentById(equipment_id);
      if (!currentEquipment) {
        throw new Error(`Equipment with ID ${equipment_id} not found for update.`);
      }
      const oldImageUrl = currentEquipment.image_url;
      let finalImageUrl: string | null | undefined = undefined; // undefined means no change to image_url from this logic

      if (imageFile) {
        // New image provided, upload it
        console.log(`New image file provided for equipment ${equipment_id}. Uploading...`);
        const uploadedImageUrl = await this.uploadEquipmentImage(imageFile);
        if (uploadedImageUrl) {
          finalImageUrl = uploadedImageUrl;
          if (oldImageUrl && oldImageUrl !== uploadedImageUrl) {
            console.log(`New image uploaded (${finalImageUrl}), deleting old image: ${oldImageUrl}`);
            await this.deleteEquipmentImage(oldImageUrl);
          }
        } else {
          console.warn(`Image upload failed for equipment ${equipment_id}. Image URL will not be updated with a new one.`);
          // Keep finalImageUrl as undefined, so DB isn't touched unless 'image_url: null' is in updates
        }
      } else if (updates.hasOwnProperty('image_url') && updates.image_url === null) {
        // Explicitly removing image (image_url passed as null, and no new file)
        console.log(`Image explicitly removed for equipment ${equipment_id}.`);
        if (oldImageUrl) {
          console.log(`Deleting old image: ${oldImageUrl}`);
          await this.deleteEquipmentImage(oldImageUrl);
        }
        finalImageUrl = null; // Set to null in DB
      }

      // Prepare the final update payload for the database
      const dbUpdates: Partial<UpdateEquipmentDTO> = { ...updates };
      if (finalImageUrl !== undefined) { // If image logic decided on a new URL (or null)
        dbUpdates.image_url = finalImageUrl;
      }
      // If finalImageUrl is undefined, dbUpdates.image_url will be whatever was in 'updates'
      // or not present if 'image_url' wasn't in 'updates'.

      const { data, error } = await supabase
        .from('equipment')
        .update(dbUpdates)
        .eq('equipment_id', equipment_id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating equipment ${equipment_id}:`, error);
        throw error;
      }
      console.log(`Equipment ${equipment_id} updated successfully.`);
      return data;
    } catch (error) {
      console.error(`Failed to update equipment ${equipment_id}:`, error);
      throw error;
    }
  },

  // Check if an equipment has existing reservations
  async checkEquipmentReservations(id: number): Promise<{ count: number, hasReservations: boolean }> {
    try {
      const { data: reservations, error: reservationsError, count } = await supabase
        .from('reservation')
        .select('reservation_id', { count: 'exact' })
        .eq('equipment_id', id);
      
      if (reservationsError) {
        console.error('Error checking reservations:', reservationsError);
        throw reservationsError;
      }
      
      const numReservations = count || 0;
      return { 
        count: numReservations, 
        hasReservations: numReservations > 0 
      };
    } catch (error) {
      console.error(`Error checking reservations for equipment ${id}:`, error);
      throw error;
    }
  },

  // Delete an equipment and cancel its associated reservations
  async deleteEquipmentWithReservations(id: number): Promise<{ deletedEquipment: Equipment | null, cancelledReservations: number }> {
    try {
      const equipmentToDelete = await this.getEquipmentById(id);
      if (!equipmentToDelete) {
        console.warn(`Equipment with ID ${id} not found for deletion. It might have been already deleted.`);
        // Return a specific structure indicating not found or failure
        return { deletedEquipment: null, cancelledReservations: 0 }; 
      }

      // 1. Delete associated image from storage if it exists
      if (equipmentToDelete.image_url) {
        console.log(`Equipment ${id} has an image (${equipmentToDelete.image_url}). Deleting image before equipment record...`);
        await this.deleteEquipmentImage(equipmentToDelete.image_url);
      } else {
        console.log(`Equipment ${id} has no image associated. Skipping image deletion.`);
      }
      
      // 2. Get the 'Cancelled' status ID
      const { data: statusData, error: statusError } = await supabase
        .from('reservation_status')
        .select('reservation_status_id')
        .eq('reservation_status', 'Cancelled')
        .single();
      if (statusError || !statusData) {
        console.error('Error finding "Cancelled" status ID:', statusError);
        throw statusError || new Error('Cancelled status ID not found');
      }
      const cancelledStatusId = statusData.reservation_status_id;
      
      // 3. Find and update associated reservations to 'Cancelled'
      const { data: reservationsToCancel, error: fetchReservationsError, count: reservationCount } = await supabase
        .from('reservation')
        .select('reservation_id', { count: 'exact' })
        .eq('equipment_id', id);

      if (fetchReservationsError) {
        console.error('Error fetching reservations for equipment deletion:', fetchReservationsError);
        throw fetchReservationsError;
      }
      
      const numReservationsToCancel = reservationCount || 0;
      if (numReservationsToCancel > 0) {
        console.log(`Updating ${numReservationsToCancel} reservations to Cancelled status for equipment ${id}`);
        const { error: updateReservationsError } = await supabase
          .from('reservation')
          .update({ reservation_status_id: cancelledStatusId })
          .eq('equipment_id', id);
        if (updateReservationsError) {
          console.error('Error updating reservations to cancelled:', updateReservationsError);
          throw updateReservationsError;
        }
      }
      
      // 4. Delete the equipment record
      console.log(`Deleting equipment record for ID: ${id}`);
      const { data: deletedData, error: deleteEquipmentError } = await supabase
        .from('equipment')
        .delete()
        .eq('equipment_id', id)
        .select()
        .single();

      if (deleteEquipmentError) {
        console.error(`Error deleting equipment ${id}:`, deleteEquipmentError);
        throw deleteEquipmentError;
      }
      
      console.log(`Equipment ${id} deleted. ${numReservationsToCancel} reservations handled.`);
      return {
        deletedEquipment: deletedData as Equipment, // Cast if confident about the shape
        cancelledReservations: numReservationsToCancel
      };
    } catch (error) {
      console.error(`Failed to delete equipment ${id} and/or its reservations:`, error);
      throw error;
    }
  },
  
  // Original deleteEquipment method, now relying on the enhanced deleteEquipmentWithReservations
  async deleteEquipment(id: number): Promise<void> {
    try {
      const result = await this.deleteEquipmentWithReservations(id);
      if (result.deletedEquipment) {
        console.log(`Equipment ${id} and associated data processed successfully.`);
      } else {
        console.warn(`Equipment ${id} was not found or not deleted.`);
      }
    } catch (error) {
      console.error(`Failed to delete equipment ${id} via deleteEquipment:`, error);
      throw error;
    }
  },

  // Subscribe to equipment changes
  subscribeToEquipment(callback: (payload: any) => void) {
    const channel = supabase.channel('public-equipment-changes');
    const subscription = channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipment' },
        (payload) => {
          console.log('Equipment change received!', payload);
          callback(payload);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to equipment changes!');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
          console.error('Subscription error or closed for equipment changes:', status, err);
          // Optionally attempt to resubscribe or notify user
        }
      });
    // Return a function to unsubscribe
    return () => {
      console.log('Unsubscribing from equipment changes.');
      supabase.removeChannel(channel); // More robust way to remove channel and its subscriptions
    };
  },
};
