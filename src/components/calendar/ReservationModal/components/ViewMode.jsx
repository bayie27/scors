import PropTypes from 'prop-types';
import { Calendar, Clock, User, Users, Phone, MapPin, Package, Edit2, X } from 'react-feather';

// Helper function to convert 24h time to 12h format (e.g., '13:30' -> '1:30 PM')
const formatTime12Hour = (timeString) => {
  if (!timeString) return 'Not set';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${hour12}:${minutes} ${ampm}`;
};

const ViewMode = ({ 
  form, 
  statusName, 
  statusStyles, 
  onClose, 
  onEditView, 
  venues, 
  equipmentList,
  organizations = []
}) => {
  // Find the organization name and code
  const organization = organizations.find(org => org.org_id === form.org_id);
  const orgDisplay = organization 
    ? `${organization.org_name || 'No Name'} (${organization.org_code || 'No Code'})`
    : 'Not specified';

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Reservation Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-2"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyles} border`}>
            {statusName}
          </span>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[70vh] p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
            <Calendar className="mr-2" size={16} />
            Event Information
          </h3>
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-gray-900">{form.purpose || 'Not specified'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  {organization ? (
                    <div className="space-y-1">
                      <p className="text-gray-900 font-medium">{organization.org_code || 'No Code'}</p>
                      <p className="text-gray-700">{organization.org_name || 'No Name'}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Not specified</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center">
                  <Calendar className="text-gray-400 mr-2" size={16} />
                  {form.end_date && form.end_date !== form.start_date ? (
                    <span className="text-gray-900">
                      {form.start_date || 'Not set'} to {form.end_date}
                      <span className="ml-2 text-xs text-gray-500">(Multi-day reservation)</span>
                    </span>
                  ) : (
                    <span className="text-gray-900">{form.start_date || 'Not set'}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center">
                  <Clock className="text-gray-400 mr-2" size={16} />
                  <span className="text-gray-900">{formatTime12Hour(form.start_time)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center">
                  <Clock className="text-gray-400 mr-2" size={16} />
                  <span className="text-gray-900">{formatTime12Hour(form.end_time)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Equipment */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
            <MapPin className="mr-2" size={16} />
            Location & Equipment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center">
                <MapPin className="text-gray-400 mr-2" size={16} />
                <span className="text-gray-900">
                  {venues.find(v => v.venue_id == form.venue_id)?.venue_name || 'No venue selected'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center">
                <Package className="text-gray-400 mr-2" size={16} />
                <span className="text-gray-900">
                  {equipmentList.find(e => e.equipment_id == form.equipment_id)?.equipment_name || 'No equipment selected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
            <Users className="mr-2" size={16} />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserved By</label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center">
                <User className="text-gray-400 mr-2" size={16} />
                <span className="text-gray-900">{form.reserved_by || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Officer in Charge</label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center">
                <User className="text-gray-400 mr-2" size={16} />
                <span className="text-gray-900">{form.officer_in_charge || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center">
                <Phone className="text-gray-400 mr-2" size={16} />
                <span className="text-gray-900">{form.contact_no || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
              <div className="text-sm text-gray-600">
                {form.reservation_ts ? new Date(form.reservation_ts).toLocaleString() : 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Last Updated</label>
              <div className="text-sm text-gray-600">
                {form.edit_ts ? new Date(form.edit_ts).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onEditView}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Edit2 size={16} className="mr-2" />
          Edit
        </button>
      </div>
    </div>
  </div>
  );
};

ViewMode.propTypes = {
  form: PropTypes.object.isRequired,
  statusName: PropTypes.string.isRequired,
  statusStyles: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onEditView: PropTypes.func.isRequired,
  venues: PropTypes.array,
  equipmentList: PropTypes.array,
  organizations: PropTypes.array,
};

export default ViewMode;
