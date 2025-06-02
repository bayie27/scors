import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../../supabase-client';
import ViewMode from './components/ViewMode';
import EditMode from './components/EditMode';
import { toast } from 'react-hot-toast';

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
  const [form, setForm] = useState({
    purpose: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    venue_id: '',
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
          
        setForm({
          purpose: initialData.purpose || '',
          // For backward compatibility with existing reservations
          start_date: initialData.start_date ? initialData.start_date.slice(0, 10) : 
                    (initialData.activity_date ? initialData.activity_date.slice(0, 10) : ''),
          end_date: initialData.end_date ? initialData.end_date.slice(0, 10) : 
                   (initialData.activity_date ? initialData.activity_date.slice(0, 10) : ''),
          start_time: initialData.start_time ? initialData.start_time.slice(0, 5) : '',
          end_time: initialData.end_time ? initialData.end_time.slice(0, 5) : '',
          venue_id: initialData.venue_id || '',
          equipment_ids: equipmentIds,
          org_id: initialData.org_id || '',
          reservation_status_id: initialData.reservation_status_id || '',
          reserved_by: initialData.reserved_by || '',
          officer_in_charge: initialData.officer_in_charge || '',
          contact_no: initialData.contact_no || '',
          reservation_ts: initialData.reservation_ts || '',
          edit_ts: initialData.edit_ts || '',
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

  // Function to check for booking conflicts
  const checkBookingConflicts = async () => {
    setIsCheckingConflicts(true);
    const conflicts = [];
    
    try {
      // Get date range for the reservation
      const startDate = form.start_date;
      const endDate = form.end_date || form.start_date;
      
      // Format times for comparison
      const startTime = form.start_time;
      const endTime = form.end_time;
      
      // Check venue conflicts if a venue is selected
      if (form.venue_id) {
        const { data: venueConflicts, error: venueError } = await supabase
          .from('reservation')
          .select('reservation_id, purpose, activity_date, start_time, end_time')
          .eq('venue_id', form.venue_id)
          .gte('activity_date', startDate)
          .lte('activity_date', endDate)
          .neq('reservation_status_id', 3) // Exclude rejected reservations
          .order('activity_date', { ascending: true });
        
        if (venueError) {
          console.error('Error checking venue conflicts:', venueError);
          setIsCheckingConflicts(false);
          return { hasConflicts: true, message: 'Error checking venue availability' };
        }
        
        // Check for time overlaps on each day
        const venueOverlaps = venueConflicts.filter(conflict => {
          // Skip the current reservation if editing
          if (isEdit && conflict.reservation_id === initialData.reservation_id) {
            return false;
          }
          
          // Check if times overlap
          return (
            (conflict.start_time <= endTime && conflict.end_time >= startTime)
          );
        });
        
        if (venueOverlaps.length > 0) {
          const venue = venues.find(v => v.venue_id === form.venue_id);
          const venueName = venue ? venue.venue_name : `Venue ${form.venue_id}`;
          
          conflicts.push({
            type: 'venue',
            name: venueName,
            conflicts: venueOverlaps
          });
        }
      }
      
      // Check equipment conflicts for each selected equipment
      if (form.equipment_ids && form.equipment_ids.length > 0) {
        for (const equipmentId of form.equipment_ids) {
          const { data: equipmentConflicts, error: equipmentError } = await supabase
            .from('reservation')
            .select('reservation_id, purpose, activity_date, start_time, end_time')
            .eq('equipment_id', equipmentId)
            .gte('activity_date', startDate)
            .lte('activity_date', endDate)
            .neq('reservation_status_id', 3) // Exclude rejected reservations
            .order('activity_date', { ascending: true });
          
          if (equipmentError) {
            console.error('Error checking equipment conflicts:', equipmentError);
            setIsCheckingConflicts(false);
            return { hasConflicts: true, message: 'Error checking equipment availability' };
          }
          
          // Check for time overlaps on each day
          const equipmentOverlaps = equipmentConflicts.filter(conflict => {
            // Skip the current reservation if editing
            if (isEdit && conflict.reservation_id === initialData.reservation_id) {
              return false;
            }
            
            // Check if times overlap
            return (
              (conflict.start_time <= endTime && conflict.end_time >= startTime)
            );
          });
          
          if (equipmentOverlaps.length > 0) {
            const equipment = equipmentList.find(e => String(e.equipment_id) === String(equipmentId));
            const equipmentName = equipment ? equipment.equipment_name : `Equipment ${equipmentId}`;
            
            conflicts.push({
              type: 'equipment',
              name: equipmentName,
              conflicts: equipmentOverlaps
            });
          }
        }
      }
      
      setIsCheckingConflicts(false);
      
      if (conflicts.length > 0) {
        return { hasConflicts: true, conflicts };
      }
      
      return { hasConflicts: false };
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setIsCheckingConflicts(false);
      return { hasConflicts: true, message: 'Error checking availability' };
    }
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
    if (!form.contact_no || !form.contact_no.trim()) {
      newErrors.contact_no = 'Contact number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(form.contact_no.replace(/[\s-]/g, ''))) {
      newErrors.contact_no = 'Please enter a valid contact number';
    }
    
    // If there are basic validation errors, don't proceed to check conflicts
    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation failed with errors:', newErrors);
      setErrors(newErrors);
      return false;
    }
    
    console.log('Basic validation passed, checking for booking conflicts...');
    
    // Check for booking conflicts
    const conflictResult = await checkBookingConflicts();
    
    if (conflictResult.hasConflicts) {
      if (conflictResult.message) {
        newErrors.booking = conflictResult.message;
        console.log('Conflict detected with message:', conflictResult.message);
      } else if (conflictResult.conflicts) {
        const conflictMessages = [];
        
        conflictResult.conflicts.forEach(conflict => {
          if (conflict.type === 'venue') {
            conflictMessages.push(`${conflict.name} is already booked during the selected time`);
          } else if (conflict.type === 'equipment') {
            conflictMessages.push(`${conflict.name} is already booked during the selected time`);
          }
        });
        
        newErrors.booking = conflictMessages.join('. ');
        console.log('Conflicts detected:', conflictMessages);
      }
    }

    // Set the errors state and return validation result
    setErrors({...newErrors});
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('ReservationModal - handleSubmit called, isEdit:', isEdit);
    
    // Clear any existing errors before validation
    setErrors({});
    
    try {
      // Validate the form - this now includes conflict checking
      const formValidation = await validateForm();
      
      // Get updated errors directly from the validation result
      const currentErrors = {...errors};
      
      // If validation failed, show toast notification for booking conflicts
      if (!formValidation && currentErrors.booking) {
        toast.error(currentErrors.booking, {
          duration: 4000,
          position: 'top-center',
          style: {
            border: '1px solid #F8BD5A',
            padding: '16px',
            color: '#713200',
          },
          iconTheme: {
            primary: '#F8BD5A',
            secondary: '#FFFAEE',
          },
        });
        
        console.log('ReservationModal - Validation failed with booking conflicts:', currentErrors.booking);
        return; // Stop if validation fails
      }
      
      if (!formValidation) {
        console.log('ReservationModal - Validation failed, not submitting');
        return; // Stop if validation fails
      }
    } catch (error) {
      console.error('Error during form validation:', error);
      toast.error('An error occurred while validating the form');
      return;
    }
    
    console.log('ReservationModal - Validation passed, proceeding with submission');
    
    // Get all dates in the selected range (excluding weekends)
    const dateArray = getDatesInRange(form.start_date, form.end_date);
    
    if (dateArray.length === 0) {
      console.log('ReservationModal - No valid dates in range');
      setErrors({ start_date: 'No valid dates in range (all dates may be weekends)' });
      return;
    }
    
    console.log('ReservationModal - Multiple dates in range:', dateArray);
    
    // Normalize phone number
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
      // For edit mode, we'll maintain backward compatibility
      // by just using the first equipment in the list if multiple were selected
      const formToSubmit = prepareFormData({
        ...form,
        activity_date: form.start_date
      }, form.equipment_ids[0]);
      
      console.log('ReservationModal - Calling onSubmit with edit data:', formToSubmit);
      onSubmit(formToSubmit);
    } else {
      console.log('ReservationModal - Handling NEW reservation submission');
      
      const allReservations = [];
      
      // Create separate reservations for each day in the date range
      dateArray.forEach((date, dateIndex) => {
        // Create a reservation for the venue if selected
        if (form.venue_id) {
          allReservations.push(
            prepareFormData({
              ...form,
              activity_date: date,
              start_date: form.start_date,
              end_date: form.end_date,
              isFirstDay: dateIndex === 0,
              isMultiDay: dateArray.length > 1,
              multiDayIndex: dateIndex,
              multiDayTotal: dateArray.length,
              equipment_ids: [], // Clear equipment IDs for venue reservation
              isVenueReservation: true
            })
          );
        }
        
        // Create a separate reservation for each selected equipment
        form.equipment_ids.forEach(equipmentId => {
          allReservations.push(
            prepareFormData({
              ...form,
              activity_date: date,
              start_date: form.start_date,
              end_date: form.end_date,
              venue_id: null, // Clear venue ID for equipment reservations
              isFirstDay: dateIndex === 0,
              isMultiDay: dateArray.length > 1,
              multiDayIndex: dateIndex,
              multiDayTotal: dateArray.length,
              isEquipmentReservation: true
            }, equipmentId)
          );
        });
      });
      
      console.log('ReservationModal - Calling onSubmit with array of', allReservations.length, 'reservations');
      onSubmit(allReservations);
    }
  };

  // Map status IDs to labels and styles based on reservation_status table
  const STATUS_LABELS = {
    1: 'Reserved',
    2: 'Rejected',
    3: 'Pending',
    4: 'Cancelled',
    5: 'Ongoing',
    6: 'Completed',
  };

  const STATUS_STYLES = {
    1: 'bg-blue-100 text-blue-800 border-blue-200',      // Reserved
    2: 'bg-red-100 text-red-800 border-red-200',         // Rejected
    3: 'bg-yellow-100 text-yellow-800 border-yellow-200',// Pending
    4: 'bg-gray-200 text-gray-700 border-gray-300',      // Cancelled
    5: 'bg-green-100 text-green-800 border-green-200',   // Ongoing
    6: 'bg-purple-100 text-purple-800 border-purple-200',// Completed
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
  const statusName = STATUS_LABELS[statusId] || 'Unknown';
  const statusStyles = STATUS_STYLES[statusId] || 'bg-gray-100 text-gray-800 border-gray-200';

  if (!open) return null;



  return isView ? (
    <ViewMode 
      form={form} 
      statusName={statusName}
      statusStyles={statusStyles}
      onClose={onClose}
      onEditView={onEditView}
      venues={venues}
      equipmentList={equipmentList}
      organizations={organizations}
    />
  ) : (
    <EditMode 
      form={form}
      onClose={onClose}
      onSubmit={handleSubmit}
      onDelete={onDelete}
      isEdit={isEdit}
      venues={venues}
      equipmentList={equipmentList}
      organizations={organizations}
      handleChange={handleChange}
      errors={errors}
    />
  );
};

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
