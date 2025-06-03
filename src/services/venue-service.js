import { supabase } from '@/supabase-client';
import { toast } from 'react-hot-toast';

// Helper to extract file path from Supabase storage URL
const getPathFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlParts = new URL(url);
    const pathSegments = urlParts.pathname.split('/');
    // Path for .remove() is relative to the bucket, e.g., 'venue_1_123.jpg' or 'folder/venue_1_123.jpg'
    // For URL: https://<project_ref>.supabase.co/storage/v1/object/public/venue_images/actual_file_path.jpg
    // We need 'actual_file_path.jpg'
    const bucketName = 'venue_images'; // Make sure this matches your bucket name
    const bucketIndex = pathSegments.indexOf(bucketName);
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      return pathSegments.slice(bucketIndex + 1).join('/');
    }
    console.warn('Could not extract path from URL for deletion:', url);
    return null;
  } catch (e) {
    console.error('Invalid URL for getPathFromUrl:', url, e);
    return null;
  }
};

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
  
  async createVenue(venueData, imageFile) {
    try {
      // Create venue first
      const { data: newVenue, error: venueError } = await supabase
        .from('venue')
        .insert([venueData])
        .select()
        .single();
      
      if (venueError) {
        console.error('Error creating venue:', venueError);
        throw venueError;
      }
      
      // If image file is provided, upload it after venue creation
      if (imageFile && newVenue) {
        // Generate a unique filename
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `venue_${newVenue.venue_id}_${Date.now()}.${fileExt}`;
        
        try {
          // Convert file to blob if needed
          const fileBlob = imageFile instanceof Blob ? imageFile : new Blob([imageFile], { type: imageFile.type });
          
          // Upload the file
          const { error: uploadError } = await supabase.storage
            .from('venue_images')
            .upload(fileName, fileBlob, {
              cacheControl: '3600',
              upsert: true,
            });
            
          if (uploadError) throw uploadError;
          
          // Get the public URL
          const { data } = supabase.storage
            .from('venue_images')
            .getPublicUrl(fileName);
          
          // Update the venue with the image URL
          const { error: updateError } = await supabase
            .from('venue')
            .update({ image_url: data.publicUrl })
            .eq('venue_id', newVenue.venue_id);
            
          if (updateError) throw updateError;
          
          // Return the updated venue with image URL
          return { ...newVenue, image_url: data.publicUrl };
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          // Return the venue even if image upload fails
          return newVenue;
        }
      }
      
      return newVenue;
    } catch (error) {
      console.error('Error in createVenue:', error);
      throw error;
    }
  },
  
  async updateVenue(venueId, venueData, imageFile, oldImageUrl) {
    try {
      const dataToUpdate = { ...venueData };
      let oldFilePathToDelete = null;

      // Scenario 1: New image is being uploaded (imageFile exists)
      // Scenario 2: Existing image is explicitly being removed (venueData.image_url === null)
      if (imageFile || venueData.image_url === null) {
        if (oldImageUrl) {
          oldFilePathToDelete = getPathFromUrl(oldImageUrl);
        }
      }

      // If an old image needs to be deleted from storage
      if (oldFilePathToDelete) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('venue_images')
            .remove([oldFilePathToDelete]);
          if (deleteError) {
            // Log error but don't necessarily block the update operation
            console.error('Error deleting old image from storage:', deleteError);
            toast.error(`Failed to delete old image: ${deleteError.message}. Continuing with update.`);
          }
        } catch (storageError) {
            console.error('Exception during old image deletion:', storageError);
            toast.error(`Error during old image deletion: ${storageError.message}.`);
        }
      }

      // If user wants to remove image (and no new one is uploaded), set DB field to null
      if (venueData.image_url === null && !imageFile) {
        dataToUpdate.image_url = null;
      } else if (imageFile) {
        // If a new image is uploaded, its URL will be set later
        // For now, don't include image_url in this initial DB update unless it was explicitly cleared
        if (dataToUpdate.hasOwnProperty('image_url') && venueData.image_url !== null) {
           // Keep existing image_url if not explicitly cleared and new one is pending upload
        } else if (venueData.image_url === null) {
            dataToUpdate.image_url = null; // Explicitly clearing
        } else {
            delete dataToUpdate.image_url; // Will be set after new image upload
        }
      }

      // Update venue text/numeric data in database
      const { data: updatedVenue, error } = await supabase
        .from('venue')
        .update(dataToUpdate)
        .eq('venue_id', venueId)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating venue with ID ${venueId}:`, error);
        throw error;
      }
      
      // If image file is provided, upload it after venue update
      if (imageFile && updatedVenue) {
        // Generate a unique filename
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `venue_${venueId}_${Date.now()}.${fileExt}`;
        
        try {
          // Convert file to blob if needed
          const fileBlob = imageFile instanceof Blob ? imageFile : new Blob([imageFile], { type: imageFile.type });
          
          // Upload the file
          const { error: uploadError } = await supabase.storage
            .from('venue_images')
            .upload(fileName, fileBlob, {
              cacheControl: '3600',
              upsert: true,
            });
            
          if (uploadError) throw uploadError;
          
          // Get the public URL
          const { data } = supabase.storage
            .from('venue_images')
            .getPublicUrl(fileName);
          
          // Update the venue with the image URL
          const { error: updateError } = await supabase
            .from('venue')
            .update({ image_url: data.publicUrl })
            .eq('venue_id', venueId);
            
          if (updateError) throw updateError;
          
          // Return the updated venue with image URL
          return { ...updatedVenue, image_url: data.publicUrl };
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          // Return the venue even if image upload fails
          return updatedVenue;
        }
      }
      
      return updatedVenue;
    } catch (error) {
      console.error('Error in updateVenue:', error);
      throw error;
    }
  },
  
  async deleteVenue(venueId) {
    try {
      // Get the venue details to find its image_url
      const venueToDelete = await this.getVenueById(venueId);

      if (venueToDelete && venueToDelete.image_url) {
        const imagePath = getPathFromUrl(venueToDelete.image_url);
        if (imagePath) {
          try {
            const { error: storageError } = await supabase.storage
              .from('venue_images')
              .remove([imagePath]);
            if (storageError) {
              console.error(`Error deleting image ${imagePath} from storage:`, storageError);
              toast.error(`Failed to delete venue image from storage: ${storageError.message}. Venue record deletion will proceed.`);
              // Decide if this error should prevent venue deletion. For now, we'll allow it.
            }
          } catch (exceptionError) {
            console.error(`Exception during image ${imagePath} deletion from storage:`, exceptionError);
            toast.error(`Error deleting venue image: ${exceptionError.message}.`);
          }
        }
      }

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
