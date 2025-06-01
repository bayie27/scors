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
          start_date: initialData.start_date ? initialData.start_date.slice(0, 10) : '',
          end_date: initialData.end_date ? initialData.end_date.slice(0, 10) : '',
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

  const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    
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
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  // Helper function to validate date and time constraints
  const validateDateTime = (startDateStr, endDateStr, startTime, endTime) => {
    const errors = {};
    const today = new Date();
    
    // Parse the selected dates
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);
    
    // Check end date if provided
    let endDate = null;
    if (endDateStr) {
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay);
      
      // Validate end date is not before start date
      if (endDate < startDate) {
        errors.end_date = 'End date cannot be before start date';
      }
    }
    
    // Check if start date is a weekend
    if (isWeekend(startDate)) {
      errors.start_date = 'Weekend dates are not allowed for reservations';
    }
    
    // Check if start date is in the past
    if (startDate < today && startDate.toDateString() !== today.toDateString()) {
      errors.start_date = 'Past dates are not allowed for reservations';
    }
    
    // Check if end date is a weekend
    if (endDate && isWeekend(endDate)) {
      errors.end_date = 'Weekend dates are not allowed for reservations';
    }
    
    // Parse times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Check if start time is before end time
    if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
      errors.end_time = 'End time must be after start time';
      return errors;
    }
    
    // Check if times are within allowed hours (7am to 9pm)
    const minHour = 7; // 7am
    const maxHour = 21; // 9pm
    
    if (startHour < minHour || startHour >= maxHour) {
      errors.start_time = `Start time must be between ${minHour}:00 and ${maxHour - 1}:59`;
    }
    
    if (endHour < minHour || endHour > maxHour || (endHour === maxHour && endMinute > 0)) {
      errors.end_time = `End time must be between ${minHour}:00 and ${maxHour}:00`;
    }
    
    // If start date is today, check if times are in the future
    if (startDate.toDateString() === today.toDateString()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (startHour < currentHour || (startHour === currentHour && startMinute <= currentMinute)) {
        errors.start_time = 'Start time must be in the future';
      }
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

    // Only proceed with time validations if we have all required time fields
    if (form.start_date && form.start_time && form.end_time) {
      const dateTimeErrors = validateDateTime(
        form.start_date, 
        form.end_date || form.start_date, // If end_date not provided, use start_date
        form.start_time, 
        form.end_time
      );
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear any existing errors before validation
    setErrors({});
    
    if (validateForm()) {
      // Normalize the phone number before submitting
      const formToSubmit = {
        ...form,
        contact_no: form.contact_no ? normalizePhoneNumber(form.contact_no) : '',
        // If end_date is not provided, use start_date (same day reservation)
        end_date: form.end_date || form.start_date
      };
      
      // If it's a multi-day reservation (start_date !== end_date),
      // we'll handle this in the parent component
      onSubmit(formToSubmit);
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
