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
        venue_id: singleFormData.venue_id || null,
        equipment_id: singleFormData.equipment_id || null,
        reservation_status_id: singleFormData.reservation_status_id || 3,
        edit_ts: now
      };
      const { error } = await supabase
        .from('reservation')
        .update(reservationData)
        .eq('reservation_id', selectedReservation.reservation_id);
      if (error) throw error;
      return { success: true };
    } else if (isMultiDayReservation) {
      // Create multiple reservations for multi-day booking
      const reservationsToInsert = formData.map(day => {
        const multiDayInfo = day.multiDayTotal > 1 
          ? ` [Multi-day ${day.multiDayIndex + 1} of ${day.multiDayTotal}]` 
          : '';
        const activity_date = day.activity_date;
        if (!activity_date) {
          console.error('Missing activity_date for a multi-day reservation item:', day);
          throw new Error('Internal error: Missing activity_date for multi-day item.');
        }
        return {
          org_id: day.org_id,
          activity_date: activity_date,
          start_time: day.start_time,
          end_time: day.end_time,
          purpose: `${day.purpose || ''}${multiDayInfo}`,
          officer_in_charge: day.officer_in_charge || '',
          reserved_by: day.reserved_by || '',
          contact_no: day.contact_no || '',
          venue_id: day.venue_id || null,
          equipment_id: day.equipment_id || null,
          reservation_status_id: 3, // Always set new reservations to Pending
          reservation_ts: now,
          edit_ts: now
        };
      });
      const { data, error } = await supabase
        .from('reservation')
        .insert(reservationsToInsert)
        .select(); // Basic select, can be expanded if needed by caller
      if (error) throw error;
      return { success: true, data };
    } else {
      // Create a single new reservation
      let activity_date = formData.start_date;
      if (!activity_date && formData.activity_date) {
        activity_date = formData.activity_date;
      }
      if (!activity_date) {
        activity_date = new Date().toISOString().split('T')[0];
      }
      const reservationData = {
        org_id: formData.org_id,
        activity_date: activity_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        purpose: formData.purpose || '',
        officer_in_charge: formData.officer_in_charge || '',
        reserved_by: formData.reserved_by || '',
        contact_no: formData.contact_no || '',
        venue_id: formData.venue_id || null,
        equipment_id: formData.equipment_id || null,
        reservation_status_id: 3, // Always set new reservations to Pending
        reservation_ts: now,
        edit_ts: now
      };
      const { data, error } = await supabase
        .from('reservation')
        .insert([reservationData])
        .select() // Basic select
        .single();
      if (error) throw error;
      return { success: true, data };
    }
  } catch (error) {
    console.error('Error in saveReservation service:', error);
    return { success: false, error };
  }
}

export async function deleteReservationService(reservationId) {
  try {
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
