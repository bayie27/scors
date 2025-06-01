import { useState, useEffect, useCallback } from 'react';
import { X } from 'react-feather';
import PropTypes from 'prop-types';

// Helper functions for time conversion
const formatTimeForDisplay = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const parseTimeInput = (time12) => {
  if (!time12) return '';
  
  // Handle both '1:30 PM' and '1:30PM' formats
  const time = time12.trim();
  const [timePart, period] = time.split(/(?<=\d)(?=[AP]M\b)/i);
  if (!timePart || !period) return '';
  
  let [hours, minutes] = timePart.split(':').map(Number);
  
  if (period.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const EditMode = ({
  form,
  onClose,
  onSubmit,
  onDelete,
  isEdit,
  venues = [],
  equipmentList = [],
  organizations = [],
  handleChange,
  errors = {}
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Reservation' : 'New Reservation'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-2"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Purpose</label>
            <input 
              type="text" 
              name="purpose" 
              value={form.purpose} 
              onChange={handleChange} 
              required 
              className={`w-full border rounded px-3 py-2 ${errors.purpose ? 'border-red-500' : ''}`} 
            />
            {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>}
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">Date</label>
              <input 
                type="date" 
                name="activity_date" 
                value={form.activity_date} 
                onChange={handleChange} 
                required 
                className={`w-full border rounded px-3 py-2 ${errors.activity_date ? 'border-red-500' : ''}`} 
              />
              {errors.activity_date && <p className="mt-1 text-sm text-red-600">{errors.activity_date}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Start Time</label>
              <input 
                type="text" 
                name="start_time" 
                value={form.start_time ? formatTimeForDisplay(form.start_time) : ''} 
                onChange={(e) => {
                  const time24 = parseTimeInput(e.target.value);
                  setForm(prev => ({
                    ...prev,
                    start_time: time24
                  }));
                }}
                placeholder="e.g., 2:30 PM"
                required 
                className={`w-full border rounded px-3 py-2 ${errors.start_time ? 'border-red-500' : ''}`} 
              />
              {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">End Time</label>
              <input 
                type="text" 
                name="end_time" 
                value={form.end_time ? formatTimeForDisplay(form.end_time) : ''} 
                onChange={(e) => {
                  const time24 = parseTimeInput(e.target.value);
                  setForm(prev => ({
                    ...prev,
                    end_time: time24
                  }));
                }}
                placeholder="e.g., 3:30 PM"
                required 
                className={`w-full border rounded px-3 py-2 ${errors.end_time ? 'border-red-500' : ''}`} 
              />
              {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">Organization</label>
              <select 
                name="org_id" 
                value={form.org_id} 
                onChange={handleChange} 
                required
                className={`w-full border rounded px-3 py-2 ${errors.org_id ? 'border-red-500' : ''}`}
              >
                {errors.org_id && <p className="mt-1 text-sm text-red-600">{errors.org_id}</p>}
                <option value="">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org.org_id} value={org.org_id}>
                    {org.org_code} - {org.org_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">Venue</label>
              <select 
                name="venue_id" 
                value={form.venue_id} 
                onChange={handleChange} 
                className={`w-full border rounded px-3 py-2 ${errors.venue_equipment ? 'border-red-500' : ''}`}
              >
                <option value="">None</option>
                {venues.map((v) => (
                  <option key={v.venue_id} value={v.venue_id}>
                    {v.venue_name || `Venue ${v.venue_id}`}
                  </option>
                ))}
              </select>
              {errors.venue_equipment && <p className="mt-1 text-sm text-red-600">{errors.venue_equipment}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Equipment</label>
              <select 
                name="equipment_id" 
                value={form.equipment_id} 
                onChange={handleChange} 
                className={`w-full border rounded px-3 py-2 ${errors.venue_equipment ? 'border-red-500' : ''}`}
              >
                <option value="">None</option>
                {equipmentList.map((e) => (
                  <option key={e.equipment_id} value={e.equipment_id}>
                    {e.equipment_name || `Equipment ${e.equipment_id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Reserved By</label>
              <input 
                type="text" 
                name="reserved_by" 
                value={form.reserved_by} 
                onChange={handleChange} 
                required 
                className={`w-full border rounded px-3 py-2 ${errors.reserved_by ? 'border-red-500' : ''}`} 
              />
              {errors.reserved_by && <p className="mt-1 text-sm text-red-600">{errors.reserved_by}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Officer in Charge</label>
              <input 
                type="text" 
                name="officer_in_charge" 
                value={form.officer_in_charge} 
                onChange={handleChange} 
                required
                className={`w-full border rounded px-3 py-2 ${errors.officer_in_charge ? 'border-red-500' : ''}`} 
              />
              {errors.officer_in_charge && <p className="mt-1 text-sm text-red-600">{errors.officer_in_charge}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Contact No.</label>
              <input 
                type="tel" 
                name="contact_no" 
                value={form.contact_no} 
                onChange={handleChange} 
                required
                className={`w-full border rounded px-3 py-2 ${errors.contact_no ? 'border-red-500' : ''}`} 
                pattern="[0-9+()\- ]+"
                title="Enter a valid Philippine phone number"
              />
              {errors.contact_no && <p className="mt-1 text-sm text-red-600">{errors.contact_no}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            {isEdit && onDelete && (
              <button 
                type="button" 
                onClick={onDelete} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            )}
            <button 
              type="submit" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEdit ? 'Update' : 'Create'} Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

EditMode.propTypes = {
  form: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  isEdit: PropTypes.bool,
  venues: PropTypes.array,
  equipmentList: PropTypes.array,
  organizations: PropTypes.array,
  handleChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
};

export default EditMode;
