import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../../supabase-client';
import ReservationModal from './ReservationModal/ReservationModal';
import { Menu, Search } from 'lucide-react';

// ... rest of the code remains the same ...
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export function EventCalendar() {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalView, setModalView] = useState(false); // true = view mode, false = edit/create
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  // Confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  // Lookup data
  const [venues, setVenues] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  const [statuses, setStatuses] = useState([]);

  // ...existing state

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [organizations, setOrganizations] = useState([]);

  // Fetch lookup data for form (now handled in the initial useEffect)

  // Fetch reservations from the database
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      // Get organizations first if not already loaded
      if (organizations.length === 0) {
        const { data: orgs } = await supabase
          .from('organization')
          .select('org_id, org_name, org_code');
        setOrganizations(orgs || []);
      }

      const { data: reservations, error: fetchError } = await supabase
        .from('reservation')
        .select(`
          *,
          venue:venue_id(*),
          equipment:equipment_id(*),
          status:reservation_status_id(*),
          organization:org_id(*)
        `);

      if (fetchError) throw fetchError;

      // Transform reservations to calendar events
      const formattedEvents = (reservations || []).map(reservation => {
        // Combine date and time fields
        const startDateTime = new Date(reservation.activity_date);
        const [startHours, startMinutes] = reservation.start_time.split(':');
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
        
        const endDateTime = new Date(reservation.activity_date);
        const [endHours, endMinutes] = reservation.end_time.split(':');
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));
        
        // Get organization info from the joined data or find in organizations state
        const org = reservation.organization || 
                   organizations.find(o => o.org_id === reservation.org_id);
        const orgCode = org?.org_code || '';
        const orgName = org?.org_name || '';
        
        return {
          id: reservation.reservation_id,
          title: reservation.purpose || 'Untitled Reservation',
          start: startDateTime,
          end: endDateTime,
          resource: reservation.venue_id ? `Venue ${reservation.venue_id}` : 
                  (reservation.equipment_id ? `Equipment ${reservation.equipment_id}` : 'No Location'),
          description: `Reserved by: ${reservation.reserved_by || 'Unknown'}\n` +
                     `Contact: ${reservation.contact_no || 'N/A'}\n` +
                     `Org: ${orgName} (${orgCode || 'No Code'})`,
          status: reservation.status?.name || 'Pending',
          participants: 1,
          allDay: false,
          rawData: {
            ...reservation,
            org_code: orgCode,
            org_name: orgName,
            organization: org || null
          }
        };
      });

      setEvents(formattedEvents);
      setFilteredEvents(formattedEvents); // Initialize filtered events with all events
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []); // Removed organizations dependency to prevent infinite loop

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch all lookup data in parallel
        const [
          { data: v },
          { data: e },
          { data: s },
          { data: orgs }
        ] = await Promise.all([
          supabase.from('venue').select('*'),
          supabase.from('equipment').select('*'),
          supabase.from('reservation_status').select('*'),
          supabase.from('organization').select('org_id, org_name, org_code')
        ]);

        setVenues(v || []);
        setEquipmentList(e || []);
        setStatuses(s || []);
        setOrganizations(orgs || []);
        
        // Now fetch reservations with all lookup data available
        await fetchReservations();
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load initial data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchReservations]);

  // Real-time subscription for reservations
  useEffect(() => {
    const channel = supabase.channel('realtime:reservation')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservation',
        },
        (payload) => {
          // Optionally: optimize by applying the change directly
          // For now, just refetch all reservations for simplicity
          fetchReservations();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations]);

  // Handle when an event is clicked (view-only first)
  const handleSelectEvent = useCallback((event) => {
    console.log('Reservation details:', event.rawData);
    setSelectedReservation(event.rawData);
    setModalEdit(false);
    setModalView(true); // open in view mode
    setModalOpen(true);
  }, []);

  // Handle when a date/time slot is selected
  // Open modal to create reservation
  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedReservation({
      activity_date: format(slotInfo.start, 'yyyy-MM-dd'),
      start_time: format(slotInfo.start, 'HH:mm'),
      end_time: format(slotInfo.end, 'HH:mm'),
    });
    setModalEdit(false);
    setModalView(false);
    setModalOpen(true);
  }, []);

  // Handle navigation between months/weeks/days
  const onNavigate = useCallback((newDate) => setDate(newDate), []);

  // Handle view change
  const onView = useCallback((newView) => setView(newView), []);

  // Custom event component
  const EventComponent = useCallback(({ event }) => {
    // Extract organization info from event.rawData
    const raw = event.rawData || {};
    const orgCode = raw.organization?.org_code || raw.org_code || '';
    const orgDisplay = orgCode || 'No Org';

    // Only show minimal info in month view
    if (view === 'month') {
      return (
        <div className="p-0.5 overflow-hidden h-full">
          <div className="rounded bg-white border border-gray-200 px-1 py-0.5 flex flex-col gap-0.5 min-w-0 h-full">
            <div className="text-xs font-semibold truncate" title={event.title}>
              {event.title}
              <div className="text-[10px] text-blue-700 font-bold truncate">
                {orgDisplay}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Default for week/day/agenda views
    return (
      <div className="p-1 overflow-hidden h-full">
        <div 
          className={`border-l-4 p-2 rounded h-full flex flex-col ${
            event.status === 'Approved' 
              ? 'bg-green-50 border-green-500' 
              : event.status === 'Rejected' 
                ? 'bg-red-50 border-red-500' 
                : 'bg-blue-50 border-blue-500'
          }`}
        >
          <div className="font-medium text-sm truncate">{event.title}</div>
          <div className="text-xs text-gray-600">
            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
          </div>
          {orgDisplay && (
            <div className="text-xs text-gray-700 mt-1 truncate" title={orgDisplay}>
              {orgDisplay}
            </div>
          )}
          {event.resource && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {event.resource}
            </div>
          )}
        </div>
      </div>
    );
  }, [view]);

  // Search function to filter events and switch to agenda view
  const handleSearch = useCallback((term) => {
    if (!term.trim()) {
      // If search is empty, show all events
      setFilteredEvents(events);
      return;
    }
    
    // Convert to lowercase for case-insensitive search
    const searchLower = term.toLowerCase();
    
    // Filter events based on search term
    const filtered = events.filter(event => 
      event.title.toLowerCase().includes(searchLower) ||
      (event.description && event.description.toLowerCase().includes(searchLower)) ||
      (event.resource && event.resource.toLowerCase().includes(searchLower)) ||
      (event.rawData?.organization?.org_name && event.rawData.organization.org_name.toLowerCase().includes(searchLower)) ||
      (event.rawData?.organization?.org_code && event.rawData.organization.org_code.toLowerCase().includes(searchLower)) ||
      (event.rawData?.officer_in_charge && event.rawData.officer_in_charge.toLowerCase().includes(searchLower)) ||
      (event.rawData?.reserved_by && event.rawData.reserved_by.toLowerCase().includes(searchLower))
    );
    
    // Update filtered events
    setFilteredEvents(filtered);
    
    // Switch to agenda view
    setView('agenda');
  }, [events]);

  // Custom toolbar with search functionality that maintains its own state
  const CustomToolbar = useCallback(({ onView, onNavigate, label }) => {
    // Use local state within the toolbar to prevent losing focus
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    
    // Only update parent state on form submission
    const handleLocalSubmit = (e) => {
      e.preventDefault();
      setSearchTerm(localSearchTerm); // Update parent state
      handleSearch(localSearchTerm);
    };
    
    // Update only local state while typing
    const handleLocalInputChange = (e) => {
      setLocalSearchTerm(e.target.value);
    };
    
    // Sync local state when parent state changes
    useEffect(() => {
      setLocalSearchTerm(searchTerm);
    }, [searchTerm]);
    return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('PREV')}
            className="p-1 text-gray-600 hover:text-gray-900"
          >
            ❮
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-1 text-gray-600 hover:text-gray-900"
          >
            ❯
          </button>
          <span className="ml-2 font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex space-x-1">
            {['month', 'week', 'day', 'agenda'].map((viewType) => (
              <button
                key={viewType}
                className={`px-3 py-1 text-sm rounded ${
                  view === viewType
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => onView(viewType)}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
          <form onSubmit={handleLocalSubmit} className="flex items-center w-full md:w-auto">
            <input
              type="text"
              value={localSearchTerm}
              onChange={handleLocalInputChange}
              placeholder="Search reservations..."
              className="px-3 py-1 border border-gray-300 rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-48 lg:w-64"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white rounded-r border border-blue-500 hover:bg-blue-600 focus:outline-none flex items-center"
            >
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }, [view, searchTerm, handleSearch]);

  // Handle form submission from the reservation modal
  const handleModalSubmit = useCallback((formData) => {
    try {
      if (!formData.org_id) {
        throw new Error('Please select an organization');
      }

      if (!formData.activity_date || !formData.start_time || !formData.end_time) {
        throw new Error('Please fill in all required date and time fields');
      }
      
      // For new reservations, create immediately
      if (!modalEdit || !selectedReservation?.reservation_id) {
        // For new reservations, proceed immediately
        performReservationAction(formData);
      } else {
        // For updates, show confirmation modal
        setPendingFormData(formData);
        setUpdateConfirmOpen(true);
      }
      
    } catch (err) {
      console.error('Validation error:', err);
      alert(err.message); // Keep simple validation alerts
    }
  }, [modalEdit, selectedReservation]);
  
  // Handle actual reservation creation/update after confirmation
  const performReservationAction = async (formData) => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const reservationData = {
        org_id: formData.org_id,
        activity_date: formData.activity_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        purpose: formData.purpose || '',
        officer_in_charge: formData.officer_in_charge || '',
        reserved_by: formData.reserved_by || '',
        contact_no: formData.contact_no || '',
        venue_id: formData.venue_id || null,
        equipment_id: formData.equipment_id || null,
        reservation_status_id: formData.reservation_status_id || 3, // Default to Pending (status_id: 3)
        reservation_ts: now,
        edit_ts: now
      };

      if (modalEdit && selectedReservation?.reservation_id) {
        // Update existing reservation
        const { error } = await supabase
          .from('reservation')
          .update({
            ...reservationData,
            edit_ts: new Date().toISOString()
          })
          .eq('reservation_id', selectedReservation.reservation_id);
        
        if (error) throw error;
      } else {
        // Create new reservation
        const { data, error } = await supabase
          .from('reservation')
          .insert([reservationData])
          .select(`
            *,
            organization:org_id (org_id, org_name, org_code),
            venue:venue_id (*),
            equipment:equipment_id (*),
            status:reservation_status_id (*)
          `)
          .single();
        
        if (error) throw error;
      }
      
      // Close all modals and refresh data
      setUpdateConfirmOpen(false);
      setDeleteConfirmOpen(false);
      setModalOpen(false);
      setPendingFormData(null);
      setSelectedReservation(null);
      setSearchTerm(''); // Clear search when creating/editing reservations
      fetchReservations();
      
    } catch (err) {
      console.error('Error performing reservation action:', err);
      alert(`Failed to ${modalEdit ? 'update' : 'create'} reservation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete button click - show confirmation modal
  const handleModalDelete = () => {
    // Show confirmation modal
    setDeleteConfirmOpen(true);
  };
  
  // Perform actual deletion after confirmation
  const performDelete = async () => {
    try {
      setLoading(true);
      if (selectedReservation?.reservation_id) {
        const { error } = await supabase
          .from('reservation')
          .delete()
          .eq('reservation_id', selectedReservation.reservation_id);
        
        if (error) throw error;
      }
      
      // Close modals and refresh data
      setDeleteConfirmOpen(false);
      setModalOpen(false);
      setSelectedReservation(null);
      fetchReservations();
    } catch (err) {
      console.error('Error deleting reservation:', err);
      alert(`Failed to delete reservation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Confirmation Modal Component
  const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, confirmColor }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative overflow-hidden p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {cancelText || 'Cancel'}
            </button>
            <button 
              type="button" 
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                confirmColor === 'red' 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Main calendar UI with loading overlay
  return (
    <div className="relative h-[calc(100vh-2rem)] bg-white p-4 rounded-lg shadow">
      {/* Modal for create/edit */}
      <ReservationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedReservation(null); setModalView(false); setModalEdit(false); }}
        onSubmit={handleModalSubmit}
        onDelete={modalEdit ? handleModalDelete : undefined}
        initialData={selectedReservation || {}}
        venues={venues}
        equipmentList={equipmentList}
        organizations={organizations}
        statuses={statuses}
        isEdit={modalEdit}
        isView={modalView && !modalEdit}
        onEditView={() => { setModalEdit(true); setModalView(false); }}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={performDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this reservation? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />
      
      {/* Update Confirmation Modal */}
      <ConfirmationModal
        isOpen={updateConfirmOpen}
        onClose={() => setUpdateConfirmOpen(false)}
        onConfirm={() => pendingFormData && performReservationAction(pendingFormData)}
        title="Confirm Update"
        message="Are you sure you want to update this reservation? This will overwrite the current information."
        confirmText="Update"
        confirmColor="blue"
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reservations...</p>
        </div>
      )}
      
      {/* Error message overlay */}
      {error && !loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-20">
          <div className="text-center text-red-500">
            <p>{error}</p>
          </div>
        </div>
      )}
      {/* Calendar */}
      <div className="h-full">
        <BigCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100% - 40px)' }}
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          defaultView={view}
          view={view}
          onView={onView}
          date={date}
          onNavigate={onNavigate}
          components={{
            event: EventComponent,
            toolbar: CustomToolbar,
          }}
          eventPropGetter={(event) => {
            let backgroundColor = '#e3f2fd';
            let borderColor = '#2196f3';
            
            if (event.status === 'Approved') {
              backgroundColor = '#e8f5e9';
              borderColor = '#4caf50';
            } else if (event.status === 'Rejected') {
              backgroundColor = '#ffebee';
              borderColor = '#f44336';
            } else if (event.status === 'Pending') {
              backgroundColor = '#fff8e1';
              borderColor = '#ffc107';
            }
            
            return {
              style: {
                backgroundColor,
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: '4px',
                color: '#1a1a1a',
                border: 'none',
                padding: '2px 8px',
                fontSize: '0.875rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              },
            };
          }}
        />
      </div>
    </div>
  );
}
