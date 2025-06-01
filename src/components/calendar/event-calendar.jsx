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

export function EventCalendar(props) {
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
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get props from parent
  const { 
    searchTerm = "", 
    onSearchChange,
    selectedSlot,
    onSlotSelected
  } = props || {};

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
        const startDateTime = new Date(reservation.start_date);
        const [startHours, startMinutes] = reservation.start_time.split(':');
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
        
        const endDateTime = new Date(reservation.start_date);
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
    const newReservation = {
      start_date: format(slotInfo.start, 'yyyy-MM-dd'),
      start_time: format(slotInfo.start, 'HH:mm'),
      end_time: format(slotInfo.end, 'HH:mm'),
    };
    setSelectedReservation(newReservation);
    setModalEdit(false);
    setModalView(false);
    setModalOpen(true);
    
    // Notify parent that a slot was selected
    if (onSlotSelected) {
      onSlotSelected(newReservation);
    }
  }, [onSlotSelected]);
  
  // Handle external slot selection (e.g., from reserve button)
  useEffect(() => {
    if (selectedSlot) {
      setSelectedReservation(selectedSlot);
      setModalEdit(false);
      setModalView(false);
      setModalOpen(true);
    }
  }, [selectedSlot]);

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

    // Only show time and purpose in month view
    if (view === 'month') {
      return (
        <div className="p-0.5 overflow-hidden h-full">
          <div className="rounded bg-white border border-gray-200 px-1 py-0.5 flex items-center gap-1 min-w-0 h-full">
            <span className="text-[10px] text-blue-700 font-semibold whitespace-nowrap">
              {format(event.start, 'h:mma')}
            </span>
            <span className="truncate" title={event.title}>
              {event.title}
            </span>
          </div>
        </div>
      );
    }
    
    // Default for week/day/agenda views - show full details
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
          {orgDisplay && (
            <div className="text-xs text-gray-700 mt-1 truncate" title={orgDisplay}>
              {orgDisplay}
            </div>
          )}
          {/* Display venue name if available */}
          {raw.venue && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {raw.venue.venue_name || 'Venue ' + raw.venue_id}
            </div>
          )}
          {/* Display equipment name if available */}
          {raw.equipment && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {raw.equipment.equipment_name || 'Equipment ' + raw.equipment_id}
            </div>
          )}
        </div>
      </div>
    );
  }, [view]);

  // Search function to filter events and switch to agenda view
  const handleSearch = useCallback((term) => {
    // If search is empty, show all events
    if (!term.trim()) {
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
    
    // Switch to agenda view when searching
    if (term.trim() && view !== 'agenda') {
      setView('agenda');
    }
  }, [events, view]);
  
  // Update search results when searchTerm or events change
  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, events, handleSearch]);

  // CustomToolbar handles only navigation and view controls
function CustomToolbar({ onView, onNavigate, label }) {
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
      </div>
    </div>
  );
}

  // Handle form submission from the reservation modal
  const handleModalSubmit = useCallback((formData) => {
    try {
      if (!formData.org_id) {
        throw new Error('Please select an organization');
      }

      if (!formData.start_date || !formData.start_time || !formData.end_time) {
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
  
  // Helper function to check if a date is a weekend
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

// Helper function to add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Handle actual reservation creation/update after confirmation
const performReservationAction = async (formData) => {
  try {
    setLoading(true);
    const now = new Date().toISOString();

    // Create the base reservation data
    const baseReservationData = {
      org_id: formData.org_id,
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
      edit_ts: now,
      end_date: formData.end_date || formData.start_date // Store the original end date for reference
    };

    if (modalEdit && selectedReservation?.reservation_id) {
      // Update existing reservation - only update a single day in edit mode
      const { error } = await supabase
        .from('reservation')
        .update({
          ...baseReservationData,
          start_date: formData.start_date,
          edit_ts: new Date().toISOString()
        })
        .eq('reservation_id', selectedReservation.reservation_id);
      
      if (error) throw error;
    } else {
      // Create new reservation(s)
      
      // Check if this is a multi-day reservation
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date || formData.start_date);
      const isMultiDay = startDate.getTime() !== endDate.getTime();
      
      if (isMultiDay) {
        // Create an array to hold all the reservations to be created
        const reservationsToCreate = [];
        
        // Generate reservations for each day in the range (excluding weekends)
        let currentDate = startDate;
        
        while (currentDate <= endDate) {
          // Skip weekends
          if (!isWeekend(currentDate)) {
            // Format the date as YYYY-MM-DD
            const formattedDate = currentDate.toISOString().split('T')[0];
            
            // Create a reservation for this day
            reservationsToCreate.push({
              ...baseReservationData,
              start_date: formattedDate
            });
          }
          
          // Move to the next day
          currentDate = addDays(currentDate, 1);
        }
        
        // Insert all reservations at once
        if (reservationsToCreate.length > 0) {
          const { error } = await supabase
            .from('reservation')
            .insert(reservationsToCreate);
          
          if (error) throw error;
        } else {
          throw new Error('No valid dates found in the selected range (all days were weekends)');
        }
      } else {
        // Single day reservation - proceed as before
        const { error } = await supabase
          .from('reservation')
          .insert([{
            ...baseReservationData,
            start_date: formData.start_date
          }])
          .select(`
            *,
            organization:org_id (org_id, org_name, org_code),
            venue:venue_id (*),
            equipment:equipment_id (*),
            status:reservation_status_id (*)
          `);
        
        if (error) throw error;
      }
      }
    
    // Close all modals and refresh data
    setUpdateConfirmOpen(false);
    setDeleteConfirmOpen(false);
    setModalOpen(false);
    setPendingFormData(null);
    setSelectedReservation(null);
    
    // Only clear search if setSearchTerm is available
    if (typeof setSearchTerm === 'function') {
      setSearchTerm('');
    }
    
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
    <div className="relative bg-white p-4 rounded-lg shadow h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        {props.onSearchChange && (
          <form onSubmit={e => e.preventDefault()} className="w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={props.searchTerm || ''}
                onChange={(e) => props.onSearchChange(e.target.value)}
                placeholder="Search reservations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
        )}
      </div>
      {/* Search bar has been moved to the header */}
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
      <div className="flex-1 min-h-0">
        <BigCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
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
            toolbar: (toolbarProps) => (
              <CustomToolbar
                {...toolbarProps}
                view={view}
              />
            ),
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
