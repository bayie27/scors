import { supabase } from '../supabase-client';

/**
 * This script updates equipment descriptions in the Supabase database
 * Run this script once to populate descriptions for the initial equipment items
 */
async function updateEquipmentDescriptions() {
  console.log('Starting equipment description updates...');
  
  const equipmentDescriptions = [
    {
      name: 'Portable Sound System 1',
      description: 'Professional-grade portable PA system with 1000W output, Bluetooth connectivity, and dual wireless microphones. Includes rechargeable battery with 8-hour runtime and tripod stand. Ideal for outdoor events and medium-sized venues.'
    },
    {
      name: 'Portable Sound System 2',
      description: 'Compact portable sound system with 500W output, USB/SD playback, and single wireless microphone. Features built-in LED lights and 6-hour battery life. Perfect for small gatherings and presentations.'
    },
    {
      name: 'Electric Fan 1',
      description: 'Industrial high-velocity floor fan with 20-inch blades, 3-speed settings, and 360° adjustable tilt. Features heavy-duty metal construction and wheels for mobility. Suitable for large spaces and event cooling.'
    },
    {
      name: 'Electric Fan 2',
      description: 'Oscillating pedestal fan with 16-inch blades, remote control, and 3 speed settings. Adjustable height (3.5-4.5 ft) and quiet operation. Ideal for stage wings and medium-sized areas.'
    },
    {
      name: 'Electric Fan 3',
      description: 'Compact desk fan with 12-inch blades, 2 speed settings, and low noise operation. Lightweight and portable with a space-saving design. Perfect for small areas, offices, and control rooms.'
    },
    {
      name: 'Paper Cutter 1',
      description: 'Heavy-duty rotary paper trimmer with 18-inch cutting length. Can cut up to 20 sheets at once. Features precision alignment grid and safety lock. Ideal for program materials, posters, and marketing materials.'
    }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  // Update each equipment item
  for (const item of equipmentDescriptions) {
    try {
      // First, get the equipment ID by name
      const { data: equipmentData, error: findError } = await supabase
        .from('equipment')
        .select('equipment_id')
        .eq('equipment_name', item.name)
        .single();
        
      if (findError) {
        console.error(`Error finding equipment "${item.name}":`, findError.message);
        errorCount++;
        continue;
      }
      
      if (!equipmentData) {
        console.warn(`Equipment "${item.name}" not found in database.`);
        continue;
      }
      
      // Update the description
      const { error: updateError } = await supabase
        .from('equipment')
        .update({ 
          equipment_desc: item.description 
        })
        .eq('equipment_id', equipmentData.equipment_id);
        
      if (updateError) {
        console.error(`Error updating description for "${item.name}":`, updateError.message);
        errorCount++;
      } else {
        console.log(`✓ Updated description for "${item.name}"`);
        successCount++;
      }
    } catch (error) {
      console.error(`Unexpected error processing "${item.name}":`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\nUpdate completed: ${successCount} successful, ${errorCount} failed`);
}

// Run the function
updateEquipmentDescriptions()
  .catch(error => {
    console.error('Fatal error:', error);
  })
  .finally(() => {
    // Close the Supabase connection when done
    // This is important for the script to exit properly
    supabase.removeAllChannels();
  });
