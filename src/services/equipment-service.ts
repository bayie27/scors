import { supabase } from '@/supabase-client';
import { Equipment, CreateEquipmentDTO, UpdateEquipmentDTO } from '@/types/equipment';

// Use the same bucket as venues for consistent image handling
const IMAGE_BUCKET = 'venue_images';
// Store the Supabase instance URL for direct public access
const SUPABASE_URL = 'https://ypqlywgargoxrvoersrj.supabase.co';

export const equipmentService = {
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
      console.error(`Error fetching equipment ${id}:`, error);
      throw error;
    }
    return data;
  },

  // Upload equipment image using simple public URL approach
  async uploadEquipmentImage(file: File): Promise<string | null> {
    if (!file) {
      console.log('No file provided to uploadEquipmentImage');
      return null;
    }

    try {
      // Generate a unique file path with timestamp
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/\s+/g, '_');
      const filePath = `equipment/${timestamp}-${cleanFileName}`;
      
      console.log(`Uploading image to ${IMAGE_BUCKET}/${filePath}`);
      
      // Upload the file directly
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Image upload failed:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filePath);
      
      console.log('Image uploaded successfully, public URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  },
  
  // Get public URL for an existing image path
  async getPublicImageUrl(imagePath: string): Promise<string | null> {
    if (!imagePath) return null;
    
    try {
      // If it's already a full URL, return it
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      
      // Extract just the filename from a path
      const fileName = imagePath.split('/').pop();
      if (!fileName) return null;
      
      let path = fileName;
      // If the path already has 'equipment/' prefix, use as is
      if (!path.startsWith('equipment/')) {
        path = `equipment/${fileName}`;
      }
      
      // Get the public URL directly
      const { data } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(path);
        
      if (!data || !data.publicUrl) {
        console.log('Could not generate public URL, image may not exist');
        return null;
      }
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  },

  // Create new equipment with optional image file upload
  async createEquipment(equipmentData: Omit<CreateEquipmentDTO, 'image_url'>, imageFile?: File): Promise<Equipment> {
    let imageUrl: string | null = null;

    // Upload image if provided
    if (imageFile) {
      try {
        imageUrl = await this.uploadEquipmentImage(imageFile);
        console.log('Image uploaded for new equipment:', imageUrl);
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Continue creating equipment without image
      }
    }

    // Insert equipment with image URL if available
    const dataToInsert = { ...equipmentData, image_url: imageUrl };

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
  
  // Helper function to get full image URL from a path or URL
  getFullImageUrl(imagePath: string | null): string | null {
    if (!imagePath) return null;
    
    // If it's already a full URL or base64 data, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
      return imagePath;
    }

    // Use the Supabase client to get the public URL
    const fullPath = imagePath.startsWith('equipment/') ? imagePath : `equipment/${imagePath}`;
    const { data } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(fullPath);
    
    if (!data?.publicUrl) {
      console.error('Failed to generate public URL for', imagePath);
      return null;
    }
    
    // Add cache busting
    const cacheBuster = `?t=${Date.now()}`;
    const publicUrl = `${data.publicUrl}${cacheBuster}`;
    console.log('Generated public URL:', publicUrl);
    return publicUrl;
  },

  // Update an existing equipment
  async updateEquipment({ equipment_id, ...updates }: UpdateEquipmentDTO, imageFile?: File): Promise<Equipment> {
    let imageUrl: string | null = updates.image_url !== undefined ? updates.image_url : null;

    // Only try to upload if there's an image file
    if (imageFile) {
      try {
        imageUrl = await this.uploadEquipmentImage(imageFile);
      } catch (uploadError) {
        console.error('Failed to upload image during equipment update:', uploadError);
        // Continue with update using existing image URL if available
      }
    }

    const dataToUpdate = { ...updates, image_url: imageUrl };    

    try {
      const { data, error } = await supabase
        .from('equipment')
        .update(dataToUpdate)
        .eq('equipment_id', equipment_id)
        .select()
        .single();
        
      if (error) {
        console.error(`Error updating equipment ${equipment_id}:`, error);
        throw error;
      }
      
      console.log('Equipment updated successfully:', data);
      return data;
    } catch (error) {
      console.error(`Failed to update equipment ${equipment_id}:`, error);
      throw error;
    }
  },

  // Check if an equipment has existing reservations
  async checkEquipmentReservations(id: number): Promise<{ count: number, hasReservations: boolean }> {
    try {
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservation')
        .select('reservation_id')
        .eq('equipment_id', id);
      
      if (reservationsError) {
        console.error('Error checking reservations:', reservationsError);
        throw reservationsError;
      }
      
      const count = reservations?.length || 0;
      return { 
        count, 
        hasReservations: count > 0 
      };
    } catch (error) {
      console.error(`Error checking reservations for equipment ${id}:`, error);
      throw error;
    }
  },

  // Delete an equipment and cancel its associated reservations
  async deleteEquipmentWithReservations(id: number): Promise<{ deletedEquipment: any, cancelledReservations: number }> {
    try {
      // First, get the equipment to find its image_url
      const equipmentToDelete = await this.getEquipmentById(id);
      
      // Get the 'Cancelled' status ID from reservation_status table
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
      
      // Find all reservations that reference this equipment
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservation')
        .select('reservation_id')
        .eq('equipment_id', id);
      
      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError);
        throw reservationsError;
      }
      
      const reservationCount = reservations?.length || 0;
      
      // Update reservation status to cancelled before deletion
      if (reservationCount > 0) {
        console.log(`Updating ${reservationCount} reservations to Cancelled status`);
        const { error: updateError } = await supabase
          .from('reservation')
          .update({ reservation_status_id: cancelledStatusId })
          .eq('equipment_id', id);
          
        if (updateError) {
          console.error('Error updating reservations:', updateError);
          throw updateError;
        }
      }
      
      // Now delete the equipment record
      const { data, error } = await supabase
        .from('equipment')
        .delete()
        .eq('equipment_id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error deleting equipment ${id}:`, error);
        throw error;
      }
      
      return {
        deletedEquipment: data,
        cancelledReservations: reservationCount
      };
    } catch (error) {
      console.error(`Failed to delete equipment ${id}:`, error);
      throw error;
    }
  },
  
  // Keep the original method for backward compatibility but now it first checks reservations
  async deleteEquipment(id: number): Promise<void> {
    try {
      await this.deleteEquipmentWithReservations(id);
      console.log(`Equipment ${id} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete equipment ${id}:`, error);
      throw error;
    }
  },

  // Subscribe to equipment changes
  subscribeToEquipment(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('public:equipment')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
        },
        (payload) => callback(payload)
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  },
};
