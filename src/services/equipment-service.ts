import { supabase } from '@/supabase-client';
import { Equipment, CreateEquipmentDTO, UpdateEquipmentDTO } from '@/types/equipment';

const EQUIPMENT_IMAGES_BUCKET = 'equipment_images';

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

  // Upload equipment image
  async uploadEquipmentImage(file: File): Promise<string | null> {
    if (!file) return null;

    try {
      // First, check if the bucket exists and create it if it doesn't
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        throw listError;
      }
      
      const bucketExists = buckets.some(bucket => bucket.name === EQUIPMENT_IMAGES_BUCKET);
      
      if (!bucketExists) {
        console.log(`Bucket '${EQUIPMENT_IMAGES_BUCKET}' not found, creating it...`);
        const { error: createError } = await supabase.storage.createBucket(EQUIPMENT_IMAGES_BUCKET, {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          throw createError;
        }
        
        // Set a public access policy
        const { error: policyError } = await supabase.storage.from(EQUIPMENT_IMAGES_BUCKET).createSignedUrls(
          ['example.txt'], // This is just a placeholder since we need to specify a file
          60 // 60 seconds expiry
        );
        
        if (policyError && !policyError.message.includes('Not Found')) {
          console.error('Error creating bucket policy:', policyError);
          // Don't throw here as we just want to continue with the upload
        }
      }
      
      // Now proceed with the upload
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(EQUIPMENT_IMAGES_BUCKET)
        .upload(filePath, file, { 
          cacheControl: '3600', // Cache for 1 hour
          upsert: false // Do not overwrite if file exists (though unlikely with timestamp)
        });

      if (uploadError) {
        console.error('Error uploading equipment image:', uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(EQUIPMENT_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('Error getting public URL for equipment image');
        // Attempt to delete the orphaned file if URL retrieval fails
        await supabase.storage.from(EQUIPMENT_IMAGES_BUCKET).remove([filePath]);
        throw new Error('Could not retrieve public URL for uploaded image.');
      }
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Equipment image upload process failed:', error);
      throw error;
    }
  },

  // Create a new equipment
  async createEquipment(equipmentData: Omit<CreateEquipmentDTO, 'image_url'>, imageFile?: File): Promise<Equipment> {
    let imageUrl: string | null = null;

    if (imageFile) {
      try {
        imageUrl = await this.uploadEquipmentImage(imageFile);
      } catch (uploadError) {
        // Handle or re-throw upload error as needed
        console.error('Failed to upload image during equipment creation:', uploadError);
        throw uploadError; // Or return a specific error response
      }
    }

    const dataToInsert: CreateEquipmentDTO = {
      ...equipmentData,
      image_url: imageUrl,
    };

    const { data, error } = await supabase
      .from('equipment')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating equipment:', error);
      // If equipment creation fails after image upload, consider deleting the uploaded image
      if (imageUrl) {
        const pathParts = imageUrl.split('/');
        const uploadedFileName = pathParts.pop();
        const uploadedFilePath = `public/${uploadedFileName}`;
        try {
          await supabase.storage.from(EQUIPMENT_IMAGES_BUCKET).remove([uploadedFilePath]);
          console.log('Cleaned up orphaned image after failed equipment creation:', uploadedFilePath);
        } catch (cleanupError) {
          console.error('Error cleaning up orphaned image:', cleanupError);
        }
      }
      throw error;
    }
    return data;
  },

  // Update an existing equipment
  async updateEquipment({ equipment_id, ...updates }: UpdateEquipmentDTO, imageFile?: File): Promise<Equipment> {
    let imageUrl: string | null = updates.image_url !== undefined ? updates.image_url : null;

    if (imageFile) {
      try {
        // Note: Consider deleting the old image from storage if a new one is uploaded
        // This would require fetching the old image_url first.
        imageUrl = await this.uploadEquipmentImage(imageFile);
      } catch (uploadError) {
        console.error('Failed to upload image during equipment update:', uploadError);
        throw uploadError;
      }
    }

    const dataToUpdate = { ...updates, image_url: imageUrl };    

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
    return data;
  },

  // Delete an equipment (and its image from storage)
  async deleteEquipment(id: number): Promise<void> {
    // First, get the equipment to find its image_url
    const equipmentToDelete = await this.getEquipmentById(id);

    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('equipment_id', id);

    if (error) {
      console.error(`Error deleting equipment ${id}:`, error);
      throw error;
    }

    // If equipment was deleted and had an image, delete it from storage
    if (equipmentToDelete && equipmentToDelete.image_url) {
      try {
        const imageUrlPath = new URL(equipmentToDelete.image_url).pathname;
        // The path in storage usually includes the bucket name as the first segment if not handled by getPublicUrl correctly
        // e.g. /equipment_images/public/image.png. We need to extract 'public/image.png'
        const pathSegments = imageUrlPath.split('/');
        const storagePath = pathSegments.slice(pathSegments.indexOf(EQUIPMENT_IMAGES_BUCKET) + 1).join('/');
        
        if (storagePath && storagePath !== '/') { // Basic check to ensure path is not empty or just bucket
            await supabase.storage.from(EQUIPMENT_IMAGES_BUCKET).remove([storagePath]);
            console.log('Deleted image from storage:', storagePath);
        } else {
            console.warn('Could not determine valid storage path for image deletion:', equipmentToDelete.image_url);
        }
      } catch (storageError) {
        console.error('Error deleting image from storage:', storageError);
        // Don't throw here, as the main record deletion was successful
      }
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
