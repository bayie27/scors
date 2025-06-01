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
    activity_date: '',
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
      if (!initialData || Object.keys(initialData).length === 0) {
        // New reservation: reset form to default empty values
        setForm({
          purpose: '',
          activity_date: '',
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
          activity_date: initialData.activity_date ? initialData.activity_date.slice(0, 10) : '',
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

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'purpose',
      'activity_date',
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

    // Check venue or equipment
    if (!form.venue_id && !form.equipment_id) {
      newErrors.venue_equipment = 'Either venue or equipment must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(form);
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
