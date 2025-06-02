import { useState, useEffect, useCallback } from 'react';
import { X, Check } from 'react-feather';
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Helper function to convert 24h time to HTML5 time input format (HH:MM)
const toTimeInputValue = (time24) => {
  if (!time24) return '';
  // Ensure we have a valid time string
  const [hours, minutes] = time24.split(':');
  return `${hours.padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
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
}) => {
  return (
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

          <div className="max-h-[70vh] overflow-y-auto py-4 space-y-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Show booking conflict message */}
              {errors.booking && (
                <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded shadow-sm text-amber-800 text-sm animate-pulse">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 mr-3 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-base mb-1">Booking Conflict Detected</h4>
                      <p>{errors.booking}</p>
                    </div>
                  </div>
                </div>
              )}
              
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
                  <label className="block text-sm font-medium">Start Date</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    value={form.start_date} 
                    onChange={handleChange} 
                    required 
                    className={`w-full border rounded px-3 py-2 ${errors.start_date ? 'border-red-500' : ''}`} 
                  />
                  {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">End Date</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    value={form.end_date} 
                    onChange={handleChange} 
                    className={`w-full border rounded px-3 py-2 ${errors.end_date ? 'border-red-500' : ''}`} 
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty for same day reservation</p>
                  {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">Start Time</label>
                  <input 
                    type="time" 
                    name="start_time"
                    value={toTimeInputValue(form.start_time)}
                    onChange={(e) => {
                      handleChange({
                        target: {
                          name: 'start_time',
                          value: e.target.value
                        }
                      });
                    }}
                    required 
                    step="300"  // 5 minute increments
                    className={`w-full border rounded px-3 py-2 ${errors.start_time ? 'border-red-500' : ''}`}
                  />
                  {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">End Time</label>
                  <input 
                    type="time" 
                    name="end_time"
                    value={toTimeInputValue(form.end_time)}
                    onChange={(e) => {
                      handleChange({
                        target: {
                          name: 'end_time',
                          value: e.target.value
                        }
                      });
                    }}
                    required 
                    step="300"  // 5 minute increments
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
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org.org_id} value={org.org_id}>
                        {org.org_code} - {org.org_name}
                      </option>
                    ))}
                  </select>
                  {errors.org_id && <p className="mt-1 text-sm text-red-600">{errors.org_id}</p>}
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
              </div>
              
              {/* Multiple Equipment Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Equipment</label>
                <div className="border rounded p-3 max-h-48 overflow-y-auto">
                  {form.equipment_ids?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {form.equipment_ids.map(id => {
                        const equipment = equipmentList.find(e => String(e.equipment_id) === String(id));
                        return (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {equipment?.equipment_name || `Equipment ${id}`}
                            <button 
                              type="button" 
                              onClick={() => {
                                handleChange({
                                  target: {
                                    name: 'equipment_checkbox',
                                    value: id,
                                    checked: false
                                  }
                                });
                              }}
                              className="text-gray-500 hover:text-gray-700"
                              aria-label="Remove"
                            >
                              <X size={14} />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {equipmentList.map(equipment => (
                      <div key={equipment.equipment_id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`equipment-${equipment.equipment_id}`}
                          name="equipment_checkbox"
                          value={String(equipment.equipment_id)}
                          checked={form.equipment_ids?.includes(String(equipment.equipment_id))}
                          onCheckedChange={(checked) => {
                            handleChange({
                              target: {
                                name: 'equipment_checkbox',
                                value: String(equipment.equipment_id),
                                checked
                              }
                            });
                          }}
                        />
                        <label 
                          htmlFor={`equipment-${equipment.equipment_id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {equipment.equipment_name || `Equipment ${equipment.equipment_id}`}
                        </label>
                      </div>
                    ))}
                    
                    {equipmentList.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No equipment available</p>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-600">Select multiple equipment items to create separate reservations</p>
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
                    onChange={(e) => {
                      let value = e.target.value;
                      
                      // Auto-convert +639 to 09 as user types
                      if (value.startsWith('+639')) {
                        value = '09' + value.substring(4);
                      }
                      
                      // Allow only numbers and + at the start
                      if (value === '' || /^[0-9\b\s-+]*$/.test(value)) {
                        handleChange({
                          target: {
                            name: 'contact_no',
                            value: value
                          }
                        });
                      }
                    }}
                    onBlur={(e) => {
                      // Format the number when leaving the field
                      if (e.target.value) {
                        const digits = e.target.value.replace(/\D/g, '');
                        let formatted = '';
                        
                        // Convert to 09 format
                        if (digits.startsWith('63')) {
                          formatted = `0${digits.substring(2)}`;
                        } else if (!digits.startsWith('0') && digits) {
                          formatted = `0${digits}`;
                        } else {
                          formatted = digits;
                        }
                        
                        if (formatted) {
                          handleChange({
                            target: {
                              name: 'contact_no',
                              value: formatted
                            }
                          });
                        }
                      }
                    }}
                    placeholder="e.g., 09123456789"
                    pattern="[0-9+()\- ]+"
                    title="Enter a valid Philippine phone number"
                    className={`w-full border rounded px-3 py-2 ${errors.contact_no ? 'border-red-500' : ''}`} 
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
                  onClick={(e) => {
                    // This is just logging, the actual submission happens through the form's onSubmit
                    console.log('EditMode - Submit button clicked, isEdit:', isEdit);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isEdit ? 'Update' : 'Create'} Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

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
