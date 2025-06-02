import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getStatusStyle } from '../../statusStyles';
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
  
  // Search state
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  
  // Confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false);
  
  // Add effect to monitor updateConfirmOpen state changes
  useEffect(() => {
    // Monitor updateConfirmOpen state changes
  }, [updateConfirmOpen]);
  
  const [pendingFormData, setPendingFormData] = useState(null);
  
  // Add effect to monitor pendingFormData state changes
  useEffect(() => {
    // Monitor pendingFormData state changes
  }, [pendingFormData]);
  
  // Effect to update localSearchTerm when props.searchTerm changes
  useEffect(() => {
    // Only update if props.searchTerm is defined and different from current local state
    if (props.searchTerm !== undefined && props.searchTerm !== localSearchTerm) {
      setLocalSearchTerm(props.searchTerm);
    }
  }, [props.searchTerm]);
  
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
      // Error fetching reservations
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
        // Error loading initial data
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
    // Process reservation details
    setSelectedReservation(event.rawData);
    setModalEdit(false);
    setModalView(true); // open in view mode
    setModalOpen(true);
  }, []);

  // Handle when a date/time slot is selected
  // Open modal to create reservation
  const handleSelectSlot = useCallback((slotInfo) => {
    // Process selected slot
    
    // Format dates
    const startDate = format(slotInfo.start, 'yyyy-MM-dd');
    const endDate = format(slotInfo.end, 'yyyy-MM-dd');
    
    // For multi-day selections in month view, the end date is the day after the last selected day
    // So we need to subtract one day for a correct end date
    const adjustedEndDate = view === 'month' && startDate !== endDate ? 
      format(new Date(slotInfo.end.getTime() - 86400000), 'yyyy-MM-dd') : 
      endDate;
    
    const newReservation = {
      activity_date: startDate,
      start_date: startDate,
      end_date: adjustedEndDate, // Use the adjusted end date
      start_time: format(slotInfo.start, 'HH:mm'),
      end_time: format(slotInfo.end, 'HH:mm'),
    };
    
    // Process new reservation
    
    setSelectedReservation(newReservation);
    setModalEdit(false);
    setModalView(false);
    setModalOpen(true);
    
    // Notify parent that a slot was selected
    if (onSlotSelected) {
      onSlotSelected(newReservation);
    }
  }, [onSlotSelected, view]);
  
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
      // Use status color for border/label in month view
      const statusClass = getStatusStyle(event.rawData?.reservation_status_id || event.status);
      return (
        <div className="p-0.5 overflow-hidden h-full">
          <div className={`rounded border px-1 py-0.5 flex items-center gap-1 min-w-0 h-full ${statusClass}`}>
            <span className="text-[10px] font-semibold whitespace-nowrap">
              {format(event.start, 'h:mma')}
            </span>
            <span className="truncate" title={event.title}>
              {event.title}
            </span>
          </div>
        </div>
      );
    }
    
    // Consistent style for week, day, and list views
    const statusClass = getStatusStyle(event.rawData?.reservation_status_id || event.status);
    return (
      <div className="p-1 overflow-hidden h-full">
        <div className={`rounded border-l-4 h-full flex flex-col ${statusClass}`} style={{ background: 'inherit' }}>
          <div className="font-medium text-sm truncate p-2">{event.title}</div>
          {orgDisplay && (
            <div className="text-xs text-gray-700 mt-1 truncate px-2" title={orgDisplay}>
              {orgDisplay}
            </div>
          )}
          {/* Display venue name if available */}
          {raw.venue && (
            <div className="text-xs text-gray-500 mt-1 truncate px-2">
              {raw.venue.venue_name || 'Venue ' + raw.venue_id}
            </div>
          )}
          {/* Display equipment name if available */}
          {raw.equipment && (
            <div className="text-xs text-gray-500 mt-1 truncate px-2">
              {raw.equipment.equipment_name || 'Equipment ' + raw.equipment_id}
            </div>
          )}
        </div>
      </div>
    );
  }, [view]);

  // Search function to filter events and switch to list view
  const handleSearch = useCallback((term) => {
    // If search is empty, show all events
    if (!term.trim()) {
      setFilteredEvents(events);
      return;
    }
    
    // Convert to lowercase for case-insensitive search
    const searchLower = term.toLowerCase();
    
    // Filter events based on search term
    const filtered = events.filter(event => {
      // Check basic fields
      if (event.title.toLowerCase().includes(searchLower) ||
          (event.description && event.description.toLowerCase().includes(searchLower)) ||
          (event.resource && event.resource.toLowerCase().includes(searchLower)) ||
          (event.rawData?.organization?.org_name && event.rawData.organization.org_name.toLowerCase().includes(searchLower)) ||
          (event.rawData?.organization?.org_code && event.rawData.organization.org_code.toLowerCase().includes(searchLower)) ||
          (event.rawData?.officer_in_charge && event.rawData.officer_in_charge.toLowerCase().includes(searchLower)) ||
          (event.rawData?.reserved_by && event.rawData.reserved_by.toLowerCase().includes(searchLower))) {
        return true;
      }
      
      // Check venue name
      if (event.rawData?.venue?.venue_name && 
          event.rawData.venue.venue_name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Check equipment name
      if (event.rawData?.equipment?.equipment_name && 
          event.rawData.equipment.equipment_name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
    
    // Update filtered events
    setFilteredEvents(filtered);
    
    // Switch to list view when searching
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
          {['month', 'week', 'day', 'list'].map((viewType) => (
            <button
              key={viewType}
              className={`px-3 py-1 text-sm rounded ${
                view === (viewType === 'list' ? 'agenda' : viewType)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => onView(viewType === 'list' ? 'agenda' : viewType)}
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
      // Check if formData is an array (multi-day reservations)
      const isMultiDayReservation = Array.isArray(formData);
      
      // Basic validation for single or first reservation
      const firstReservation = isMultiDayReservation ? formData[0] : formData;
      
      if (!firstReservation.org_id) {
        throw new Error('Please select an organization');
      }
      
      // Check for required date fields - support both old activity_date and new start_date
      const hasDateField = firstReservation.activity_date || firstReservation.start_date;
      if (!hasDateField || !firstReservation.start_time || !firstReservation.end_time) {
        throw new Error('Please fill in all required date and time fields');
      }
      
      // For new reservations, create immediately
      if (!modalEdit || !selectedReservation?.reservation_id) {
        // New reservation, proceed immediately
        performReservationAction(formData);
      } else {
        // Update existing reservation, showing confirmation


        
        // Store the form data and show the confirmation dialog
        setPendingFormData(formData);

        setUpdateConfirmOpen(true);
        
        // Force render the confirmation dialog by using setTimeout
        setTimeout(() => {

        }, 100);
      }
      
    } catch (err) {
      // Validation error
      alert(err.message); // Keep simple validation alerts
    }
  }, [modalEdit, selectedReservation]);
  
  // Handle actual reservation creation/update after confirmation
  const performReservationAction = async (formData) => {
    try {
      setLoading(true);
      // Generate timezone-aware timestamp for current time
      // Helper to get local time ISO string (Asia/Manila, UTC+8)
      function getLocalISOString() {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISO = new Date(now - tzOffset).toISOString().slice(0, -1); // remove 'Z'
        return localISO;
      }
      const now = getLocalISOString();
      const isMultiDayReservation = Array.isArray(formData);

      if (modalEdit && selectedReservation?.reservation_id) {
        // Update existing reservation - always a single reservation
        const singleFormData = isMultiDayReservation ? formData[0] : formData;
        // Make sure we use activity_date as the primary date field for updates
        let activity_date = singleFormData.start_date;
        if (!activity_date && singleFormData.activity_date) {
          activity_date = singleFormData.activity_date;
        }
        if (!activity_date) {
          activity_date = new Date().toISOString().split('T')[0];
        }
        // Log the data being sent for debugging
        console.log('[EDIT RESERVATION] Updating with:', {
          ...singleFormData,
          activity_date,
          reservation_id: selectedReservation.reservation_id
        });
        const reservationData = {
          org_id: singleFormData.org_id,
          activity_date: activity_date,
          start_time: singleFormData.start_time,
          end_time: singleFormData.end_time,
          purpose: singleFormData.purpose || '',
          officer_in_charge: singleFormData.officer_in_charge || '',
          reserved_by: singleFormData.reserved_by || '',
          contact_no: singleFormData.contact_no || '',
          venue_id: singleFormData.venue_id || null,
          equipment_id: singleFormData.equipment_id || null,
          reservation_status_id: singleFormData.reservation_status_id || 3, // Maintain existing status or default to Pending
          edit_ts: now
        };
        const { error } = await supabase
          .from('reservation')
          .update({
            ...reservationData,
            edit_ts: now
          })
          .eq('reservation_id', selectedReservation.reservation_id);
        if (error) {
          console.error('[EDIT RESERVATION] Supabase error:', error);
          alert('Failed to update reservation: ' + (error.message || error));
          throw error;
        }
      } else if (isMultiDayReservation) {
        // Create multiple reservations for multi-day booking
        // Store multi-day information in the purpose field by appending it
        const reservationsToInsert = formData.map(day => {
          // Format purpose to include multi-day information
          const multiDayInfo = day.multiDayTotal > 1 
            ? ` [Multi-day ${day.multiDayIndex + 1} of ${day.multiDayTotal}]` 
            : '';
          
          // CRITICAL: For multi-day reservations, ALWAYS use the activity_date that was set in the ReservationModal
          // This ensures each reservation gets its own specific date from the dateArray
          // DO NOT override or modify this value as it contains the unique date for each day's reservation
          const activity_date = day.activity_date;
          
          // Creating reservation for the selected date and day
          
          // Validate that we have a valid activity_date
          if (!activity_date) {
            // Missing activity_date for reservation
          }
            
          return {
            org_id: day.org_id,
            // Store the specific activity date for this reservation day
            // This must be preserved for multi-day reservations to work correctly
            activity_date: activity_date,
            start_time: day.start_time,
            end_time: day.end_time,
            // Store the multi-day info in the purpose field
            purpose: `${day.purpose || ''}${multiDayInfo}`,
            officer_in_charge: day.officer_in_charge || '',
            reserved_by: day.reserved_by || '',
            contact_no: day.contact_no || '',
            venue_id: day.venue_id || null,
            equipment_id: day.equipment_id || null,
            reservation_status_id: 3, // Always set new reservations to Pending (status_id: 3)
            reservation_ts: now,
            edit_ts: now
          };
        });

        // Insert all reservations at once
        const { data, error } = await supabase
          .from('reservation')
          .insert(reservationsToInsert)
          .select(`
            *,
            organization:org_id (org_id, org_name, org_code),
            venue:venue_id (*),
            equipment:equipment_id (*),
            status:reservation_status_id (*)
          `);
        
        if (error) throw error;
      } else {
        // Create a single new reservation
        // Ensure activity_date is set correctly - use start_date as the primary source
        let activity_date = formData.start_date;
        if (!activity_date && formData.activity_date) {
          activity_date = formData.activity_date;
        }
        if (!activity_date) {
          activity_date = new Date().toISOString().split('T')[0];
        }
        
        const reservationData = {
          org_id: formData.org_id,
          activity_date: activity_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          purpose: formData.purpose || '',
          officer_in_charge: formData.officer_in_charge || '',
          reserved_by: formData.reserved_by || '',
          contact_no: formData.contact_no || '',
          venue_id: formData.venue_id || null,
          equipment_id: formData.equipment_id || null,
          reservation_status_id: 3, // Always set new reservations to Pending (status_id: 3)
          reservation_ts: now,
          edit_ts: now
        };
        
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
      
      // Only clear search if setSearchTerm is available
      if (typeof setSearchTerm === 'function') {
        setSearchTerm('');
      }
      
      fetchReservations();
      
    } catch (err) {
      // Error performing reservation action
      console.error('[RESERVATION ACTION ERROR]', err);
      alert(`Failed to ${modalEdit ? 'update' : 'create'} reservation: ${err.message || err}`);
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
      // Error deleting reservation
      alert(`Failed to delete reservation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Confirmation Modal Component
  const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, confirmColor }) => {

    if (!isOpen) {

      return null;
    }
    
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
        <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
        <form onSubmit={e => e.preventDefault()} className="w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={localSearchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                // First update local state to ensure the input shows what user is typing
                setLocalSearchTerm(newValue);
                
                // Then propagate the change to search functionality
                if (props.onSearchChange) {
                  props.onSearchChange(newValue);
                } else {
                  // If no onSearchChange prop, use internal search handling
                  handleSearch(newValue);
                }
              }}
              placeholder="Search reservations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>
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
        onEditView={() => { 


          setModalEdit(true); 
          setModalView(false); 

        }}
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
      
      {/* Update Confirmation Modal - Added key to force re-render */}
      {updateConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="relative bg-white rounded-lg p-8 max-w-lg mx-auto" style={{ minWidth: '400px' }}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Update</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to update this reservation? This will overwrite the current information.</p>
            
            <div className="mt-6 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {

                  setUpdateConfirmOpen(false);
                }}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {

                  if (pendingFormData) {
                    performReservationAction(pendingFormData);
                    setUpdateConfirmOpen(false);
                  } else {
                    // No pendingFormData available for update
                  }
                }}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
      
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
            // Get status ID from event data
            const statusId = event.rawData?.reservation_status_id || 
              (event.status === 'Reserved' || event.status === 'Approved' ? 1 :
               event.status === 'Rejected' ? 2 :
               event.status === 'Pending' ? 3 :
               event.status === 'Cancelled' ? 4 : 3);
            
            // Define soft, pleasant background colors for each status
            const bgColors = {
              1: '#edf5ff', // Reserved/Approved - soft blue
              2: '#fef1f1', // Rejected - soft red
              3: '#fef9ee', // Pending - soft cream (instead of harsh yellow)
              4: '#f8f8f8', // Cancelled - light gray
            };
            
            // Get border color from statusStyles
            let borderClass = getStatusStyle(statusId);
            let borderColor = '#ddd'; // Default gray
            
            // Extract color from class string (e.g. from "border-blue-200" extract "blue")
            const colorMatch = borderClass.match(/border-(\w+)-\d+/);
            if (colorMatch && colorMatch[1]) {
              const color = colorMatch[1];
              // Map to full hex colors
              const colorMap = {
                'blue': '#3b82f6',
                'red': '#ef4444',
                'yellow': '#eab308',
                'gray': '#9ca3af',
                'purple': '#8b5cf6'
              };
              borderColor = colorMap[color] || borderColor;
            }
            
            return {
              style: {
                backgroundColor: bgColors[statusId] || '#ffffff',
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
