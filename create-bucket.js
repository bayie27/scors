// Temporary script to create the equipment_images bucket
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://ypqlywgargoxrvoersrj.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || ''; // This will be filled in when running

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    // Create the equipment_images bucket
    const { data, error } = await supabase.storage.createBucket('equipment_images', {
      public: true, // Make the bucket public so images can be accessed without authentication
      fileSizeLimit: 5242880, // 5MB in bytes
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }

    console.log('Bucket created successfully:', data);
    
    // Set public access policy for the bucket
    const { error: policyError } = await supabase.storage.from('equipment_images').createPolicy('public-read', {
      type: 'read',
      definition: {
        role: 'anon',
      },
      allow: true,
    });

    if (policyError) {
      console.error('Error setting bucket policy:', policyError);
      return;
    }
    
    console.log('Public read policy set successfully');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createBucket();
