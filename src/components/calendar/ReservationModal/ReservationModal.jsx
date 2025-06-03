import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../../supabase-client';
import { updateReservationStatusService } from '../../../services/calendarService';
import ViewMode from './components/ViewMode';
import EditMode from './components/EditMode';
import ConfirmStatusModal from './ConfirmStatusModal';
import { toast } from 'react-hot-toast';
import { getStatusLabel, getStatusStyle } from '../../../statusStyles';

const ReservationModal = ({
  open,
  onClose,
  onSubmit,
  onDelete,
  initialData = {},
  venues = [],
  equipmentList = [],
  organizations = [],
  statuses = [],
  isEdit = false,
  isView = false,
  onEditView = () => {},
}) => {
  // Confirmation modal state for create
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [pendingReservations, setPendingReservations] = useState(null);

  // Confirmation modal for create reservation
  const CreateConfirmationModal = ({ isOpen, onClose, onConfirm, reservations }) => {
    if (!isOpen) return null;
    // Summarize reservation info for user confirmation
    const count = Array.isArray(reservations) ? reservations.length : 1;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative overflow-hidden p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Reservation</h3>
          <p className="text-sm text-gray-600 mb-4">
            {count > 1
              ? `Are you sure you want to create ${count} reservations for the selected date range and resources?`
              : 'Are you sure you want to create this reservation?'}
          </p>
          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const [form, setForm] = useState({
    purpose: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    venue_id: '', // Single venue ID
    equipment_ids: [], // Array to store multiple equipment IDs
    org_id: '',
    reservation_status_id: '',
    reserved_by: '',
    officer_in_charge: '',
    contact_no: '',
  });

  useEffect(() => {
    if (open) {
      // Clear any existing errors when modal opens
      setErrors({});
      
      if (!initialData || Object.keys(initialData).length === 0) {
        // New reservation: reset form to default empty values
        setForm({
          purpose: '',
          start_date: '',
          end_date: '',
          start_time: '',
          end_time: '',
          venue_id: '',
          equipment_ids: [], // Reset to empty array
          org_id: '',
          reservation_status_id: '',
          reserved_by: '',
          officer_in_charge: '',
          contact_no: '',
        });
      } else {
        // Edit/view: use only initialData, not merging with previous form
        // For backwards compatibility, convert equipment_id to equipment_ids array if needed
        const equipmentIds = initialData.equipment_ids || 
          (initialData.equipment_id ? [initialData.equipment_id] : []);
          
        // For backward compatibility, ensure we have a venue_id
        const venueId = initialData.venue_id || (initialData.venues && initialData.venues.length > 0 ? initialData.venues[0].venue_id : '');
          
        setForm({
          reservation_id: initialData.reservation_id || '',
          purpose: initialData.purpose || '',
          // For backward compatibility with existing reservations
          start_date: initialData.start_date ? initialData.start_date.slice(0, 10) : 
                    (initialData.activity_date ? initialData.activity_date.slice(0, 10) : ''),
          end_date: initialData.end_date ? initialData.end_date.slice(0, 10) : 
                   (initialData.activity_date ? initialData.activity_date.slice(0, 10) : ''),
          start_time: initialData.start_time ? initialData.start_time.slice(0, 5) : '',
          end_time: initialData.end_time ? initialData.end_time.slice(0, 5) : '',
          venue_id: venueId || '',
          equipment_ids: equipmentIds,
          org_id: initialData.org_id || '',
          reservation_status_id: initialData.reservation_status_id || '',
          reserved_by: initialData.reserved_by || '',
          officer_in_charge: initialData.officer_in_charge || '',
          contact_no: initialData.contact_no || '',
          reservation_ts: initialData.reservation_ts || '',
          edit_ts: initialData.edit_ts || '',
          decision_ts: initialData.decision_ts || '',
        });
      }
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox for equipment selection
    if (name === 'equipment_checkbox') {
      const equipmentId = value;
      
      setForm((prev) => {
        let updatedEquipmentIds;
        
        if (checked) {
          // Add the equipment ID if checked
          updatedEquipmentIds = [...prev.equipment_ids, equipmentId];
        } else {
          // Remove the equipment ID if unchecked
          updatedEquipmentIds = prev.equipment_ids.filter(id => id !== equipmentId);
        }
        
        return { ...prev, equipment_ids: updatedEquipmentIds };
      });
      
      // Clear venue/equipment error if any equipment is selected
      if (checked) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.venue_equipment;
          return newErrors;
        });
      }
      
      return;
    }


    
    // Handle other form fields
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear venue/equipment error if venue is selected
    if (name === 'venue_id' && value) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.venue_equipment;
        return newErrors;
      });
    }
  };

  const [errors, setErrors] = useState({});
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Normalize phone number input by stripping non-numeric characters and adding proper format
  const normalizePhoneNumber = (phone) => {
    // Handle null, undefined, or non-string values
    if (!phone) return '';
    if (typeof phone !== 'string') {
      phone = String(phone);
    }
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it starts with 63 (country code), ensure it has the +
    if (digits.startsWith('63')) {
      return `+${digits}`;
    }
    
    // If it starts with 0, replace with +63
    if (digits.startsWith('0')) {
      return `+63${digits.substring(1)}`;
    }
    
    // Otherwise, assume it's a local number and add +63
    return `+63${digits}`;
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return false;
    
    // Normalize the phone number first
    const normalized = normalizePhoneNumber(phone);
    
    // Should be in the format +639XXXXXXXXX (12 digits total)
    return /^\+639\d{9}$/.test(normalized);
  };
  
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Format as +63 9XX XXX XXXX
    const normalized = normalizePhoneNumber(phone);
    if (normalized.length === 13) {
      return `${normalized.substring(0, 3)} ${normalized.substring(3, 6)} ${normalized.substring(6, 9)} ${normalized.substring(9)}`;
    }
    return phone; // Return original if not in expected format
  };

  // Helper function to check if a date is a weekend
  const isWeekend = (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };
  
  // Helper function to get all dates in range (excluding weekends)
  const getDatesInRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateArray = [];
    
    // Loop from start date to end date
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      // Skip weekends
      if (!isWeekend(new Date(dt))) {
        dateArray.push(new Date(dt).toISOString().split('T')[0]);
      }
    }
    
    return dateArray;
  };

  const validateForm = async () => {
    const newErrors = {};

    // Check if purpose is empty
    if (!form.purpose || !form.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    // Check if start date is empty
    if (!form.start_date) {
      newErrors.start_date = 'Start date is required';
    } else {
      // Enforce 2 days in advance policy
      const today = new Date();
      today.setHours(0,0,0,0);
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + 2); // 2 days in advance
      const startDateObj = new Date(form.start_date);
      if (startDateObj < minDate) {
        newErrors.start_date = 'Reservations should be made at least 2 days in advance (today and tomorrow are not allowed).';
      }
    }

    // Check if end date is before start date
    if (form.end_date && form.start_date && form.end_date < form.start_date) {
      newErrors.end_date = 'End date cannot be before start date';
    }

    // Check if start time is empty
    if (!form.start_time) {
      newErrors.start_time = 'Start time is required';
    } else {
      // Check if start time is within business hours (7:00 AM to 9:00 PM)
      const startHour = parseInt(form.start_time.split(':')[0]);
      if (startHour < 7 || startHour >= 21) {
        newErrors.start_time = 'Start time must be between 7:00 AM and 9:00 PM';
      }
    }

    // Check if end time is empty or before start time
    if (!form.end_time) {
      newErrors.end_time = 'End time is required';
    } else {
      // Check if end time is within business hours (7:00 AM to 9:00 PM)
      const endHour = parseInt(form.end_time.split(':')[0]);
      if (endHour < 7 || endHour > 21 || (endHour === 21 && parseInt(form.end_time.split(':')[1]) > 0)) {
        newErrors.end_time = 'End time must be between 7:00 AM and 9:00 PM';
      } else if (form.end_time <= form.start_time) {
        // End time must always be after start time
        // Each reservation (even in multi-day bookings) uses these times on its specific date
        newErrors.end_time = 'End time must be after start time';
      }
    }

    // Check if either venue or equipment is selected
    if (!form.venue_id && (!form.equipment_ids || form.equipment_ids.length === 0)) {
      newErrors.venue_equipment = 'Either venue or at least one equipment must be selected';
    }

    // Check if organization is selected
    if (!form.org_id) {
      newErrors.org_id = 'Organization is required';
    }

    // Check if reserved by is empty
    if (!form.reserved_by || !form.reserved_by.trim()) {
      newErrors.reserved_by = 'Reserved by is required';
    }

    // Check if officer in charge is empty
    if (!form.officer_in_charge || !form.officer_in_charge.trim()) {
      newErrors.officer_in_charge = 'Officer in charge is required';
    }

    // Check if contact number is empty or not valid (basic validation)
    if (!(form.contact_no && String(form.contact_no).trim())) {
      newErrors.contact_no = 'Contact number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(String(form.contact_no).replace(/[\s-]/g, ''))) {
      newErrors.contact_no = 'Please enter a valid contact number';
    }
    
    // If there are basic validation errors, don't proceed
    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation failed with errors:', newErrors);
      setErrors(newErrors);
      return false;
    }

    // Set the errors state and return validation result
    setErrors({...newErrors});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('ReservationModal - handleSubmit called, isEdit:', isEdit);
    
    // Clear any existing errors before validation
    setErrors({});
    let formValidation = false;
    try {
      // Validate the form
      formValidation = await validateForm();
      
      // Get updated errors directly from the validation result
      const currentErrors = {...errors};
      
      // If validation failed, do not submit
      if (!formValidation) {
        console.log('ReservationModal - Validation failed, not submitting');
        return; // Stop if validation fails
      }
    } catch (error) {
      // Validation or other error
      console.error('ReservationModal - Error during validation or submit:', error);
      alert('Validation failed: ' + (error.message || error));
      return;
    }

    // Prepare data for submission
    const dateArray = getDatesInRange(form.start_date, form.end_date || form.start_date);
    const normalizedPhone = form.contact_no ? normalizePhoneNumber(form.contact_no) : '';
    
    // Prepare base form data with proper type conversion
    const prepareFormData = (formData, specificEquipmentId = null) => ({
      ...formData,
      venue_id: formData.venue_id ? Number(formData.venue_id) : null,
      equipment_id: specificEquipmentId ? Number(specificEquipmentId) : null,
      org_id: Number(formData.org_id),
      reserved_by: formData.reserved_by, // Keep as string, don't convert to number
      officer_in_charge: formData.officer_in_charge, // Keep as string, don't convert to number
      contact_no: normalizedPhone,
      reservation_status_id: formData.reservation_status_id ? Number(formData.reservation_status_id) : 3 // Default to 'Pending' status
    });
    
    if (isEdit) {
      console.log('ReservationModal - Handling EDIT mode submission');
      // For edit mode, prepare consolidated reservation data
      const formToSubmit = {
        ...form,
        activity_date: form.start_date,
        // Keep the venue_id but set equipment_id to null for the main reservation
        venue_id: form.venue_id ? Number(form.venue_id) : null,
        equipment_id: null,
        // Include the array for equipment
        equipment_ids: form.equipment_ids
      };
      
      console.log('ReservationModal - Calling onSubmit with edit data:', formToSubmit);
      onSubmit(formToSubmit);
    } else {
      console.log('ReservationModal - Handling NEW reservation submission');
      
      const allReservations = [];
      
      // Create one consolidated reservation for each day in the date range
      dateArray.forEach((date, dateIndex) => {
        // Create a single reservation with venue_id and equipment_ids array
        allReservations.push({
          ...form,
          activity_date: date,
          start_date: form.start_date,
          end_date: form.end_date,
          venue_id: form.venue_id ? Number(form.venue_id) : null, // Keep the single venue_id
          equipment_id: null, // Set to null for new schema
          org_id: Number(form.org_id),
          reserved_by: form.reserved_by,
          officer_in_charge: form.officer_in_charge,
          contact_no: normalizedPhone,
          reservation_status_id: form.reservation_status_id ? Number(form.reservation_status_id) : 3, // Default to 'Pending' status
          isFirstDay: dateIndex === 0,
          isMultiDay: dateArray.length > 1,
          multiDayIndex: dateIndex,
          multiDayTotal: dateArray.length
        });
      });
      
      console.log('ReservationModal - Calling onSubmit with array of', allReservations.length, 'consolidated reservations');
      // Instead of submitting directly, show confirmation modal
      setPendingReservations(allReservations);
      setShowCreateConfirm(true);
    }
  };


  // Helper function to format date range for display
  const getDateRangeText = () => {
    if (!form.start_date) return '';
    if (!form.end_date || form.start_date === form.end_date) {
      return new Date(form.start_date).toLocaleDateString();
    }
    return `${new Date(form.start_date).toLocaleDateString()} - ${new Date(form.end_date).toLocaleDateString()}`;
  };

  const statusId = Number(form.reservation_status_id);
  const statusName = getStatusLabel(statusId);
  const statusStyles = getStatusStyle(statusId);

  // State for status confirmation modal
  const [statusModal, setStatusModal] = useState({ open: false, action: null });

  // Handler for reservation creation confirmation
  const handleCreateConfirm = () => {
    setShowCreateConfirm(false);
    if (pendingReservations) {
      onSubmit(pendingReservations);
      setPendingReservations(null);
    }
  };

  // Handler for Reject
  const handleReject = () => {
    setStatusModal({ open: true, action: 'reject' });
  };

  // Handler for Approve
  const handleApprove = () => {
    setStatusModal({ open: true, action: 'approve' });
  };
  
  // Handler for Cancel
  const handleCancel = () => {
    setStatusModal({ open: true, action: 'cancel' });
  };

  // Confirm approve/reject/cancel
  const handleConfirmStatus = async () => {
    // 1 = approved/reserved, 2 = rejected, 4 = cancelled
    const newStatusId = statusModal.action === 'approve' ? 1 : (statusModal.action === 'cancel' ? 4 : 2);
    
    try {
      const result = await updateReservationStatusService(form.reservation_id, newStatusId);

      if (result.success && result.data?.decision_ts) {
        setForm(prev => ({ 
          ...prev, 
          reservation_status_id: newStatusId,
          decision_ts: result.data.decision_ts
        }));
        
        let successMessage = '';
        if (statusModal.action === 'approve') {
          successMessage = 'Reservation approved!';
        } else if (statusModal.action === 'reject') {
          successMessage = 'Reservation rejected!';
        } else if (statusModal.action === 'cancel') {
          successMessage = 'Reservation cancelled!';
        }
        toast.success(successMessage);
      } else {
        console.error('[UPDATE STATUS ERROR]', result.error);
        toast.error(`Failed to update reservation status: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('[UNEXPECTED STATUS UPDATE FLOW ERROR]', err);
      toast.error(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
    } finally {
      setStatusModal({ open: false, action: null });
    }
  };

  if (!open) return null;

  return (
    <>
      {isView ? (
        <ViewMode 
          form={form} 
          statusName={statusName}
          statusStyles={statusStyles}
          onClose={onClose}
          onEditView={onEditView}
          venues={venues}
          equipmentList={equipmentList}
          organizations={organizations}
          onReject={handleReject}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onDelete={onDelete}
        />
      ) : (
        <EditMode 
          form={form}
          onClose={onClose}
          onSubmit={handleSubmit}
          isEdit={isEdit}
          venues={venues}
          equipmentList={equipmentList}
          organizations={organizations}
          handleChange={handleChange}
          errors={errors}
        />
      )}
      {/* Confirmation modal for create reservation */}
      <CreateConfirmationModal 
        isOpen={showCreateConfirm} 
        onClose={() => setShowCreateConfirm(false)} 
        onConfirm={handleCreateConfirm} 
        reservations={pendingReservations} 
      />
      {/* Confirmation modal for approve/reject status change */}
      <ConfirmStatusModal 
        isOpen={statusModal.open} 
        onClose={() => setStatusModal({ open: false, action: null })} 
        onConfirm={handleConfirmStatus} 
        action={statusModal.action} 
      />
    </>
  );
}

ReservationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  initialData: PropTypes.object,
  venues: PropTypes.array,
  equipmentList: PropTypes.array,
  organizations: PropTypes.array,
  statuses: PropTypes.array,
  isEdit: PropTypes.bool,
  isView: PropTypes.bool,
  onEditView: PropTypes.func,
};

export default ReservationModal;
