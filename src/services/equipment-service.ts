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
      if (!imageUrl.startsWith('equipment/')) {
        filePathToDelete = `equipment/${imageUrl}`;
      } else {
        filePathToDelete = imageUrl;
      }
    }
    
    if (!filePathToDelete) {
      console.error(`Could not determine file path from URL/path: ${imageUrl}. Aborting deletion.`);
      return;
    }

    try {
      const { error: deleteError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .remove([filePathToDelete]);

      if (deleteError) {
        console.error(`Failed to delete image ${filePathToDelete} from bucket ${IMAGE_BUCKET}:`, deleteError.message);
      } else {
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
      if (error.code === 'PGRST116') {
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
      return null;
    }
    try {
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = `equipment/${timestamp}-${cleanFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading equipment image:', uploadError.message);
        throw uploadError;
      }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${filePath}`;
      return publicUrl;

    } catch (error) {
      console.error('Exception during image upload:', error);
      return null;
    }
  },

  // Get public URL for an existing image path/URL
  async getPublicImageUrl(imagePathOrUrl: string): Promise<string | null> {
    if (!imagePathOrUrl) return null;
    const storageBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/`;
    if (imagePathOrUrl.startsWith(storageBaseUrl)) {
      return imagePathOrUrl;
    }
    let finalPath = imagePathOrUrl;
    if (!imagePathOrUrl.startsWith('equipment/')) {
        finalPath = `equipment/${imagePathOrUrl}`;
    }
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(finalPath);
    if (data && data.publicUrl) {
      return data.publicUrl;
    }
    return null;
  },

  // Create new equipment
  async createEquipment(equipmentData: Omit<CreateEquipmentDTO, 'image_url'>, imageFile?: File): Promise<Equipment> {
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await this.uploadEquipmentImage(imageFile);
        if (!imageUrl) {
          console.warn('Image upload failed, creating equipment without image.');
        }
      }
      const { data, error } = await supabase
        .from('equipment')
        .insert([{ ...equipmentData, image_url: imageUrl }])
        .select()
        .single(); 
      if (error) {
        console.error('Error creating equipment:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Failed to create equipment:', error);
      throw error;
    }
  },

  getFullImageUrl(imagePathOrUrl: string | null): string | null {
    if (!imagePathOrUrl) return null;
    const storageBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/`;
    if (imagePathOrUrl.startsWith(storageBaseUrl)) {
      return imagePathOrUrl.includes('?') ? imagePathOrUrl : `${imagePathOrUrl}?t=${new Date().getTime()}`;
    }
    let pathInBucket = imagePathOrUrl;
    if (!imagePathOrUrl.startsWith('equipment/')) {
        pathInBucket = `equipment/${imagePathOrUrl}`;
    }
    const fullUrl = `${storageBaseUrl}${pathInBucket}`;
    return `${fullUrl}?t=${new Date().getTime()}`;
  },

  // Update an existing equipment
  async updateEquipment({ equipment_id, ...updates }: UpdateEquipmentDTO, imageFile?: File): Promise<Equipment> {
    try {
      let finalImageUrl: string | null | undefined = undefined;
      const currentEquipment = await this.getEquipmentById(equipment_id);
      const oldImageUrl = currentEquipment?.image_url;

      if (imageFile) {
        if (oldImageUrl) {
          await this.deleteEquipmentImage(oldImageUrl);
        }
        finalImageUrl = await this.uploadEquipmentImage(imageFile);
        if (!finalImageUrl) {
          console.warn('New image upload failed. Reverting to old image URL or keeping as is based on updates.');
          finalImageUrl = updates.hasOwnProperty('image_url') ? updates.image_url : oldImageUrl;
        }
      } else if (updates.image_url === null && oldImageUrl) {
        await this.deleteEquipmentImage(oldImageUrl);
        finalImageUrl = null;
      } else if (updates.hasOwnProperty('image_url')) {
        finalImageUrl = updates.image_url;
      } else {
        finalImageUrl = oldImageUrl; // No change to image if not specified
      }

      const dbUpdates: Partial<UpdateEquipmentDTO> = { ...updates };
      if (finalImageUrl !== undefined || updates.hasOwnProperty('image_url')) { 
        dbUpdates.image_url = finalImageUrl;
      }
      
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
      return data;
    } catch (error) {
      console.error(`Failed to update equipment ${equipment_id}:`, error);
      throw error;
    }
  },

  // Check if an equipment has existing reservations and return their unique IDs
  async checkEquipmentReservations(id: number): Promise<{ count: number, hasReservations: boolean, reservationIds: number[] }> {
    try {
      const { data: directReservations, error: directError } = await supabase
        .from('reservation')
        .select('reservation_id')
        .eq('equipment_id', id);
      if (directError) console.error('Error checking direct reservations:', directError);

      const { data: joinTableReservations, error: joinTableError } = await supabase
        .from('reservation_equipment')
        .select('reservation_id')
        .eq('equipment_id', id);
      if (joinTableError) console.error('Error checking reservations via join table:', joinTableError);

      const reservationIdSet = new Set<number>();
      directReservations?.forEach(r => { if (r.reservation_id !== null) reservationIdSet.add(r.reservation_id); });
      joinTableReservations?.forEach(r => { if (r.reservation_id !== null) reservationIdSet.add(r.reservation_id); });

      const uniqueReservationIds = Array.from(reservationIdSet);
      const numReservations = uniqueReservationIds.length;
      return {
        count: numReservations,
        hasReservations: numReservations > 0,
        reservationIds: uniqueReservationIds
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
        console.warn(`Equipment with ID ${id} not found for deletion.`);
        return { deletedEquipment: null, cancelledReservations: 0 };
      }

      if (equipmentToDelete.image_url) {
        await this.deleteEquipmentImage(equipmentToDelete.image_url);
      }

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

      const { reservationIds, count: numUniqueReservations } = await this.checkEquipmentReservations(id);
      let actualCancelledCount = 0;

      if (numUniqueReservations > 0) {
        const { error: updateReservationsError } = await supabase
          .from('reservation')
          .update({ reservation_status_id: cancelledStatusId })
          .in('reservation_id', reservationIds);
        if (updateReservationsError) {
          console.error('Error updating reservations to cancelled:', updateReservationsError);
        } else {
          actualCancelledCount = reservationIds.length; 
        }
      }

      const { error: deleteJoinTableError } = await supabase
        .from('reservation_equipment')
        .delete()
        .eq('equipment_id', id);
      if (deleteJoinTableError) {
        console.error(`Error deleting entries from reservation_equipment for equipment ${id}:`, deleteJoinTableError);
      }

      const { data: deletedData, error: deleteEquipmentError } = await supabase
        .from('equipment')
        .delete()
        .eq('equipment_id', id)
        .select()
        .single(); 
      if (deleteEquipmentError) {
        if (deleteEquipmentError.code === 'PGRST116') {
           console.warn(`Equipment ${id} not found during final delete, likely already deleted.`);
           return { deletedEquipment: null, cancelledReservations: actualCancelledCount };
        }
        console.error(`Error deleting equipment ${id}:`, deleteEquipmentError);
        throw deleteEquipmentError;
      }
      return {
        deletedEquipment: deletedData as Equipment,
        cancelledReservations: actualCancelledCount
      };
    } catch (error) {
      console.error(`Failed to delete equipment ${id} and/or its reservations:`, error);
      throw error;
    }
  },
  
  async deleteEquipment(id: number): Promise<void> {
    try {
      await this.deleteEquipmentWithReservations(id);
      // console.log(`Deletion process for equipment ${id} completed.`); // Optional: Log summary if needed
    } catch (error) {
      console.error(`Failed to delete equipment ${id} via deleteEquipment wrapper:`, error);
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
          callback(payload);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
          console.error('Subscription error or closed for equipment changes:', status, err);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
