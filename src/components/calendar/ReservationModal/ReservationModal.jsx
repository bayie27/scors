import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ViewMode from './components/ViewMode';
import EditMode from './components/EditMode';

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
    equipment_id: '',
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
          equipment_id: '',
          org_id: '',
          reservation_status_id: '',
          reserved_by: '',
          officer_in_charge: '',
          contact_no: '',
        });
      } else {
        // Edit/view: use only initialData, not merging with previous form
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
          equipment_id: initialData.equipment_id || '',
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear venue/equipment error if either is selected
    if ((name === 'venue_id' && value) || (name === 'equipment_id' && value)) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.venue_equipment;
        return newErrors;
      });
    }
  };

  const [errors, setErrors] = useState({});

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

  // Helper function to validate date and time constraints
  const validateDateTime = (startDateStr, endDateStr, startTime, endTime) => {
    const errors = {};
    
    try {
      const startDate = new Date(startDateStr);
      const endDate = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
      const today = new Date();
      
      // Reset hours for date comparison
      today.setHours(0, 0, 0, 0);
      
      // Check if dates are valid
      if (isNaN(startDate.getTime())) {
        errors.start_date = 'Invalid start date format';
      }
      
      if (endDateStr && isNaN(endDate.getTime())) {
        errors.end_date = 'Invalid end date format';
      }
      
      // If any date is invalid, return early
      if (errors.start_date || errors.end_date) return errors;
      
      // Check if start date is in the past
      if (startDate < today) {
        errors.start_date = 'Cannot reserve dates in the past';
      }
      
      // Check if dates are in correct order
      if (endDate < startDate) {
        errors.end_date = 'End date cannot be before start date';
      }
      
      // Check if start date is a weekend
      if (isWeekend(startDate)) {
        errors.start_date = 'Reservations are not allowed on weekends';
      }
      
      // Check if end date is a weekend
      if (endDateStr && isWeekend(endDate)) {
        errors.end_date = 'Reservations are not allowed on weekends';
      }
      
      // Parse times
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Check if start time is before end time
      if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
        errors.end_time = 'End time must be after start time';
      }
      
      // Check if times are within allowed hours (7am to 9pm)
      const minHour = 7; // 7am
      const maxHour = 21; // 9pm
      
      if (startHour < minHour || startHour >= maxHour) {
        errors.start_time = `Start time must be between ${minHour}:00 and ${maxHour - 1}:59`;
      }
      
      if (endHour < minHour || endHour > maxHour) {
        errors.end_time = `End time must be between ${minHour}:00 and ${maxHour}:00`;
      }
      
      // Check date range (shouldn't be more than 30 days)
      const daysDifference = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (daysDifference > 30) {
        errors.end_date = 'Reservation range cannot exceed 30 days';
      }
      
      // If it's today, check if times are in the future
      if (startDate.toDateString() === today.toDateString()) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        if (startHour < currentHour || (startHour === currentHour && startMinute <= currentMinute)) {
          errors.start_time = 'Start time must be in the future';
        }
      }
    } catch (err) {
      errors.start_date = 'Error validating dates';
    }
    
    return errors;
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'purpose',
      'start_date',
      'start_time',
      'end_time',
      'org_id',
      'reserved_by',
      'officer_in_charge',
      'contact_no'
    ];

    // Check required fields
    requiredFields.forEach(field => {
      if (!form[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // If end_date is not provided, default to start_date for same-day reservations
    if (!form.end_date && form.start_date) {
      form.end_date = form.start_date;
    }

    // Only proceed with time validations if we have all required time fields
    if (form.start_date && form.end_date && form.start_time && form.end_time) {
      const dateTimeErrors = validateDateTime(form.start_date, form.end_date, form.start_time, form.end_time);
      Object.assign(newErrors, dateTimeErrors);
    }

    // Validate contact number format if provided
    if (form.contact_no && !validatePhoneNumber(form.contact_no)) {
      newErrors.contact_no = 'Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789)';
    }

    // Check venue or equipment
    if (!form.venue_id && !form.equipment_id) {
      newErrors.venue_equipment = 'Either venue or equipment must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('ReservationModal - handleSubmit called, isEdit:', isEdit);
    console.log('ReservationModal - Current form data:', form);
    
    // Clear any existing errors before validation
    setErrors({});
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      console.log('ReservationModal - Validation errors:', validationErrors);
      setErrors(validationErrors);
      return;
    }
    
    console.log('ReservationModal - Validation passed, proceeding with submission');
    console.log('ReservationModal - isEdit:', isEdit);
    
    // Get all dates in the selected range (excluding weekends)
    const dateArray = getDatesInRange(form.start_date, form.end_date);
    
    if (dateArray.length === 0) {
      console.log('ReservationModal - No valid dates in range');
      setErrors({ start_date: 'No valid dates in range (all dates may be weekends)' });
      return;
    }
    
    // Normalize phone number
    const normalizedPhone = form.contact_no ? normalizePhoneNumber(form.contact_no) : '';
    
    if (isEdit) {
      console.log('ReservationModal - Handling EDIT mode submission');
      // When editing, just update the single reservation with new values
      // Make sure we preserve the activity_date field for compatibility with existing code
      const formToSubmit = {
        ...form,
        activity_date: form.start_date, // Use start_date as the activity_date for the edited reservation
        contact_no: normalizedPhone
      };
      console.log('ReservationModal - Calling onSubmit with edit data:', formToSubmit);
      onSubmit(formToSubmit);
    } else {
      console.log('ReservationModal - Handling NEW reservation submission');
      // For new reservations, create multiple individual reservations
      // All reservations including the first one
      const allReservations = dateArray.map((date, index) => ({
        ...form,
        activity_date: date, // Set activity_date to the current date in the array
        start_date: form.start_date, // Keep original start/end dates for reference
        end_date: form.end_date,
        contact_no: normalizedPhone,
        isFirstDay: index === 0,
        isMultiDay: dateArray.length > 1,
        multiDayIndex: index,
        multiDayTotal: dateArray.length
      }));
      
      console.log('ReservationModal - Calling onSubmit with array of', allReservations.length, 'reservations');
      // Submit all reservations to the parent component
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
