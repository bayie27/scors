import { supabase } from '../supabase-client'; // Adjusted path assuming services is one level down from src

// Helper to get local time ISO string (Asia/Manila, UTC+8)
function getLocalISOString() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localISO = new Date(now - tzOffset).toISOString().slice(0, -1); // remove 'Z'
  return localISO;
}

export async function saveReservation(formData, selectedReservation, modalEdit) {
  const now = getLocalISOString();
  const isMultiDayReservation = Array.isArray(formData);

  try {
    if (modalEdit && selectedReservation?.reservation_id) {
      // Update existing reservation - always a single reservation
      const singleFormData = isMultiDayReservation ? formData[0] : formData;
      let activity_date = singleFormData.start_date;
      if (!activity_date && singleFormData.activity_date) {
        activity_date = singleFormData.activity_date;
      }
      if (!activity_date) {
        // Fallback, though should ideally always be present
        activity_date = new Date().toISOString().split('T')[0];
      }

      const reservationData = {
        org_id: singleFormData.org_id,
        activity_date: activity_date,
        start_time: singleFormData.start_time,
        end_time: singleFormData.end_time,
        purpose: singleFormData.purpose || '',
        officer_in_charge: singleFormData.officer_in_charge || '',
        reserved_by: singleFormData.reserved_by || '',
        contact_no: singleFormData.contact_no || '',
        // Use single venue ID
        venue_id: singleFormData.venue_id ? Number(singleFormData.venue_id) : null,
        reservation_status_id: singleFormData.reservation_status_id || 3,
        edit_ts: now
      };

      // Update main reservation record
      const { error } = await supabase
        .from('reservation')
        .update(reservationData)
        .eq('reservation_id', selectedReservation.reservation_id);
      
      if (error) throw error;

      // No longer using venue associations table - we directly store the venue_id in the reservation table

      // Handle equipment associations
      if (singleFormData.equipment_ids && singleFormData.equipment_ids.length > 0) {
        // First delete existing equipment associations
        const { error: deleteEquipmentError } = await supabase
          .from('reservation_equipment')
          .delete()
          .eq('reservation_id', selectedReservation.reservation_id);
        
        if (deleteEquipmentError) throw deleteEquipmentError;

        // Then insert new equipment associations
        const equipmentAssociations = singleFormData.equipment_ids.map(equipment_id => ({
          reservation_id: selectedReservation.reservation_id,
          equipment_id: Number(equipment_id)
        }));

        const { error: insertEquipmentError } = await supabase
          .from('reservation_equipment')
          .insert(equipmentAssociations);
        
        if (insertEquipmentError) throw insertEquipmentError;
      }

      return { success: true };
    } else if (isMultiDayReservation) {
      // Create multiple reservations for multi-day booking
      const results = [];

      // Process each day's reservation
      for (const day of formData) {
        const multiDayInfo = day.multiDayTotal > 1 
          ? ` [Multi-day ${day.multiDayIndex + 1} of ${day.multiDayTotal}]` 
          : '';
        
        const activity_date = day.activity_date;
        if (!activity_date) {
          console.error('Missing activity_date for a multi-day reservation item:', day);
          throw new Error('Internal error: Missing activity_date for multi-day item.');
        }

        // 1. Insert the main reservation record
        const reservationData = {
          org_id: day.org_id,
          activity_date: activity_date,
          start_time: day.start_time,
          end_time: day.end_time,
          purpose: `${day.purpose || ''}${multiDayInfo}`,
          officer_in_charge: day.officer_in_charge || '',
          reserved_by: day.reserved_by || '',
          contact_no: day.contact_no || '',
          venue_id: day.venue_id ? Number(day.venue_id) : null,
          reservation_status_id: 3, // Always set new reservations to Pending
          reservation_ts: now,
          edit_ts: now
        };

        const { data: newReservation, error } = await supabase
          .from('reservation')
          .insert([reservationData])
          .select()
          .single();
        
        if (error) throw error;

        // No longer using venue associations - venue_id is directly in the reservation

        // 3. Insert equipment associations
        if (day.equipment_ids && day.equipment_ids.length > 0) {
          const equipmentAssociations = day.equipment_ids.map(equipment_id => ({
            reservation_id: newReservation.reservation_id,
            equipment_id: Number(equipment_id)
          }));

          const { error: equipmentError } = await supabase
            .from('reservation_equipment')
            .insert(equipmentAssociations);
          
          if (equipmentError) throw equipmentError;
        }

        results.push(newReservation);
      }

      return { success: true, data: results };
    } else {
      // Create a single new reservation
      let activity_date = formData.start_date;
      if (!activity_date && formData.activity_date) {
        activity_date = formData.activity_date;
      }
      if (!activity_date) {
        activity_date = new Date().toISOString().split('T')[0];
      }

      // 1. Insert the main reservation record
      const reservationData = {
        org_id: formData.org_id,
        activity_date: activity_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        purpose: formData.purpose || '',
        officer_in_charge: formData.officer_in_charge || '',
        reserved_by: formData.reserved_by || '',
        contact_no: formData.contact_no || '',
        venue_id: formData.venue_id ? Number(formData.venue_id) : null,
        reservation_status_id: 3, // Always set new reservations to Pending
        reservation_ts: now,
        edit_ts: now
      };

      const { data: newReservation, error } = await supabase
        .from('reservation')
        .insert([reservationData])
        .select()
        .single();
      
      if (error) throw error;

      // No longer using venue associations - venue_id is directly in the reservation table

      // 3. Insert equipment associations
      if (formData.equipment_ids && formData.equipment_ids.length > 0) {
        const equipmentAssociations = formData.equipment_ids.map(equipment_id => ({
          reservation_id: newReservation.reservation_id,
          equipment_id: Number(equipment_id)
        }));

        const { error: equipmentError } = await supabase
          .from('reservation_equipment')
          .insert(equipmentAssociations);
        
        if (equipmentError) throw equipmentError;
      }

      return { success: true, data: newReservation };
    }
  } catch (error) {
    console.error('Error in saveReservation service:', error);
    return { success: false, error };
  }
}

export async function deleteReservationService(reservationId) {
  try {
    // Delete associated venue records
    const { error: venueError } = await supabase
      .from('reservation_venue')
      .delete()
      .eq('reservation_id', reservationId);
    
    if (venueError) throw venueError;

    // Delete associated equipment records
    const { error: equipmentError } = await supabase
      .from('reservation_equipment')
      .delete()
      .eq('reservation_id', reservationId);
    
    if (equipmentError) throw equipmentError;

    // Delete the main reservation record
    const { error } = await supabase
      .from('reservation')
      .delete()
      .eq('reservation_id', reservationId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteReservationService:', error);
    return { success: false, error };
  }
}

export async function updateReservationStatusService(reservationId, newStatusId) {
  const now = getLocalISOString();
  try {
    const { error } = await supabase
      .from('reservation')
      .update({
        reservation_status_id: newStatusId,
        decision_ts: now
      })
      .eq('reservation_id', reservationId);
    if (error) throw error;
    return { success: true, data: { decision_ts: now } }; // Return decision_ts
  } catch (error) {
    console.error('Error in updateReservationStatusService:', error);
    return { success: false, error };
  }
}

// New function to fetch a reservation with its associated venues and equipment
export async function fetchReservationWithRelations(reservationId) {
  try {
    // Fetch the main reservation record
    const { data: reservation, error } = await supabase
      .from('reservation')
      .select(`
        *,
        organization:org_id(*)
      `)
      .eq('reservation_id', reservationId)
      .single();
    
    if (error) throw error;
    
    // Fetch associated venues
    const { data: venueRelations, error: venueError } = await supabase
      .from('reservation_venue')
      .select(`
        venue:venue_id(*)
      `)
      .eq('reservation_id', reservationId);
    
    if (venueError) throw venueError;
    
    // Fetch associated equipment
    const { data: equipmentRelations, error: equipmentError } = await supabase
      .from('reservation_equipment')
      .select(`
        equipment:equipment_id(*)
      `)
      .eq('reservation_id', reservationId);
    
    if (equipmentError) throw equipmentError;
    
    // Extract venues and equipment from relations
    const venues = venueRelations.map(relation => relation.venue);
    const equipment = equipmentRelations.map(relation => relation.equipment);
    
    // Add venues and equipment to the reservation object
    return {
      success: true,
      data: {
        ...reservation,
        venues,
        equipment,
        venue_ids: venues.map(venue => venue.venue_id),
        equipment_ids: equipment.map(equip => equip.equipment_id)
      }
    };
  } catch (error) {
    console.error('Error in fetchReservationWithRelations:', error);
    return { success: false, error };
  }
}
