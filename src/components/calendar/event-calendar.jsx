import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getStatusStyle } from '../../statusStyles';
import { supabase } from '../../supabase-client';
import ReservationModal from './ReservationModal/ReservationModal';
import { Menu, Search, Filter, X, ChevronDown } from 'lucide-react';
import CustomToolbar from './CustomToolbar';
import toast from 'react-hot-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FilterPopover from './FilterPopover';
import { saveReservation, deleteReservationService } from '../../services/calendarService'; // Adjusted path

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
  // Status label mapping for reservation_status_id
  const statusLabelMap = {
    1: 'Reserved',
    2: 'Rejected',
    3: 'Pending',
    4: 'Cancelled',
  };


  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalView, setModalView] = useState(false); // true = view mode, false = edit/create
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  // Search and filter state
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  
  // Filter states
  const [organizationFilters, setOrganizationFilters] = useState([]);
  const [venueFilters, setVenueFilters] = useState([]);
  const [equipmentFilters, setEquipmentFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  
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


  // Fetch reservations from the database with filters
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

      // Build query with new relationship structure
      let query = supabase
        .from('reservation')
        .select(`
          *,
          status:reservation_status_id(*),
          organization:org_id(*),
          venue:venue_id(*)
        `);
      
      // Apply filters if they exist
      if (organizationFilters.length > 0) {
        const orgIds = organizationFilters.map(org => org.org_id);
        query = query.in('org_id', orgIds);
      }
      
      if (statusFilters.length > 0) {
        const statusIds = statusFilters.map(st => st.reservation_status_id);
        query = query.in('reservation_status_id', statusIds);
      }
      
      const { data: reservations, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Apply venue filters if they exist
      if (venueFilters.length > 0) {
        const venueIds = venueFilters.map(v => v.venue_id);
        reservations = reservations.filter(r => venueIds.includes(r.venue_id));
      }
      
      // Fetch equipment relationships for all reservations
      const reservationIds = reservations.map(r => r.reservation_id);
      
      // Only query if there are reservations
      let equipmentRelationships = [];
      
      if (reservationIds.length > 0) {
        // Fetch equipment relationships with all equipment details
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('reservation_equipment')
          .select(`
            reservation_id,
            equipment:equipment_id(equipment_id, equipment_name, equipment_desc, asset_status_id)
          `)
          .in('reservation_id', reservationIds);
        
        if (equipmentError) throw equipmentError;
        equipmentRelationships = equipmentData || [];
        
        // Apply equipment filters if they exist
        if (equipmentFilters.length > 0) {
          const equipmentIds = equipmentFilters.map(eq => eq.equipment_id);
          equipmentRelationships = equipmentRelationships.filter(er => 
            equipmentIds.includes(er.equipment.equipment_id)
          );
          // If venue filters aren't applied, filter reservations by equipment
          if (venueFilters.length === 0) {
            const filteredReservationIds = [...new Set(equipmentRelationships.map(er => er.reservation_id))];
            reservations = reservations.filter(r => filteredReservationIds.includes(r.reservation_id));
          }
        }
      }
      
      // We'll look up venues by their venue_id from the reservations
      
      const equipmentByReservation = {};
      equipmentRelationships.forEach(relation => {
        if (!equipmentByReservation[relation.reservation_id]) {
          equipmentByReservation[relation.reservation_id] = [];
        }
        equipmentByReservation[relation.reservation_id].push(relation.equipment);
      });

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
        
        // Get venue from the joined data or fall back to local venues
        const venue = reservation.venue || 
                     venues.find(v => v.venue_id === reservation.venue_id) || 
                     null;
        const equipment = equipmentByReservation[reservation.reservation_id] || [];
        
        // Create resource text that shows venue and equipment
        let resourceText = '';
        if (venue) {
          resourceText += `Venue: ${venue.venue_name}`;
        }
        
        // Debug equipment data
        console.log(`Reservation ${reservation.reservation_id} equipment:`, equipment);
        
        if (equipment && equipment.length > 0) {
          if (resourceText) resourceText += ' | ';
          // Make sure we handle equipment entries that might be missing equipment_name
          resourceText += `Equipment: ${equipment.map(e => e?.equipment_name || `Item #${e?.equipment_id || 'Unknown'}`).join(', ')}`;
        }
        if (!resourceText) resourceText = 'No Location or Equipment';
        
        return {
          id: reservation.reservation_id,
          title: reservation.purpose || 'Untitled Reservation',
          start: startDateTime,
          end: endDateTime,
          resource: resourceText,
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
            organization: org || null,
            venue: venue, // Ensure venue is properly passed
            equipment, // Add equipment array
            equipment_ids: equipment.map(e => e.equipment_id) // Add equipment IDs for easier access
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

  // Status color mapping with better contrast
  const statusColors = {
    1: 'border-green-500 bg-green-50', // Reserved/Approved
    2: 'border-red-500 bg-red-50',    // Rejected
    3: 'border-yellow-500 bg-yellow-50', // Pending
    4: 'border-gray-500 bg-gray-50',   // Cancelled
  };

  // Custom event component
  const EventComponent = useCallback(({ event }) => {
    // Extract organization info from event.rawData
    const raw = event.rawData || {};
    const orgCode = raw.organization?.org_code || raw.org_code || '';
    const orgDisplay = orgCode || 'No Org';
    const statusId = event.rawData?.reservation_status_id || event.status || 1;
    const statusClass = statusColors[statusId] || 'border-blue-500 bg-blue-50';

    // Month view - compact display
    if (view === 'month') {
      return (
        <div className="p-0.5 h-full">
          <div 
            className={`rounded-md border-l-4 p-1 h-full flex flex-col overflow-hidden shadow-sm ${statusClass} hover:shadow-md transition-shadow duration-150`}
          >
            <div className="flex items-start gap-1">
              <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap mt-0.5">
                {format(event.start, 'h:mma')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-900 truncate leading-tight" title={event.title}>
                  {event.title}
                </div>
                {orgDisplay && orgDisplay !== 'No Org' && (
                  <div className="text-[10px] text-gray-500 truncate leading-tight" title={orgDisplay}>
                    {orgDisplay}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Week/Day/List views - detailed display
    return (
      <div className="p-0.5 h-full">
        <div 
          className={`rounded-md border-l-4 p-2 h-full flex flex-col overflow-hidden shadow-sm ${statusClass} hover:shadow-md transition-all duration-150`}
          style={{ background: 'inherit' }}
        >
          {/* Event title */}
          <div className="mb-1">
            <div className="font-medium text-sm text-gray-900 leading-tight break-words">
              {event.title}
            </div>
          </div>
          
          {/* Event details - compact in week view */}
          <div className="space-y-1 mt-1">
            {orgDisplay && orgDisplay !== 'No Org' && (
              <div className="text-xs text-gray-600 truncate">
                {orgDisplay}
              </div>
            )}
            
            {/* Venue on its own line */}
            {raw.venue && (
              <div className="text-xs text-gray-700 font-medium">
                {raw.venue.venue_name || `Venue ${raw.venue_id}`}
              </div>
            )}
            
            {/* Equipment on the next line */}
            {(raw.equipment || raw.equipment_id) && (
              <div className="mt-0.5">
                {Array.isArray(raw.equipment) && raw.equipment.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {raw.equipment.map((e) => (
                      <span key={e.equipment_id} className="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                        {e.equipment_name || `Item ${e.equipment_id}`}
                      </span>
                    ))}
                  </div>
                ) : raw.equipment_id ? (
                  <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                    {raw.equipment?.equipment_name || `Item ${raw.equipment_id}`}
                  </span>
                ) : null}
              </div>
            )}
          </div>
          
          {/* Status badge */}
          <div className="mt-2 pt-1.5 border-t border-gray-100">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              statusId === 1 ? 'bg-green-100 text-green-800' : 
              statusId === 2 ? 'bg-red-100 text-red-800' :
              statusId === 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {statusId === 1 ? 'Approved' :
               statusId === 2 ? 'Rejected' :
               statusId === 3 ? 'Pending' :
               statusId === 4 ? 'Cancelled' : 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    );
  }, [view]);

  // Search and filter function
  const handleSearch = useCallback((term) => {
    // Filter events based on search term and filters
    let filtered = events;
    
    // Apply search term filter if it exists
    if (term.trim()) {
      const searchLower = term.toLowerCase();
      
      filtered = filtered.filter(event => {
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
      
      // Switch to list view when searching
      if (view !== 'agenda') {
        setView('agenda');
      }
    }
    
    // Apply organization filters
    if (organizationFilters.length > 0) {
      const orgIds = organizationFilters.map(org => org.org_id);
      filtered = filtered.filter(event => 
        event.rawData?.organization && orgIds.includes(event.rawData.organization.org_id)
      );
    }
    
    // Apply venue filters
    if (venueFilters.length > 0) {
      const venueIds = venueFilters.map(v => v.venue_id);
      filtered = filtered.filter(event => 
        event.rawData?.venue && venueIds.includes(event.rawData.venue.venue_id)
      );
    }
    
    // Apply equipment filters
    if (equipmentFilters.length > 0) {
      const equipmentIds = equipmentFilters.map(eq => eq.equipment_id);
      filtered = filtered.filter(event => 
        event.rawData?.equipment && equipmentIds.includes(event.rawData.equipment.equipment_id)
      );
    }
    
    // Apply status filters
    if (statusFilters.length > 0) {
      const statusIds = statusFilters.map(st => st.reservation_status_id);
      filtered = filtered.filter(event => 
        event.rawData?.status && statusIds.includes(event.rawData.status.reservation_status_id)
      );
    }
    
    // Update filtered events
    setFilteredEvents(filtered);
  }, [events, view, organizationFilters, venueFilters, equipmentFilters, statusFilters]);
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setOrganizationFilters([]);
    setVenueFilters([]);
    setEquipmentFilters([]);
    setStatusFilters([]);
    toast.success('All filters cleared');
  }, []);
  
  // Remove individual filter
  const removeFilter = useCallback((type, id) => {
    switch (type) {
      case 'organization':
        setOrganizationFilters(prev => prev.filter(org => org.org_id !== id));
        break;
      case 'venue':
        setVenueFilters(prev => prev.filter(v => v.venue_id !== id));
        break;
      case 'equipment':
        setEquipmentFilters(prev => prev.filter(eq => eq.equipment_id !== id));
        break;
      case 'status':
        setStatusFilters(prev => prev.filter(st => st.reservation_status_id !== id));
        break;
      default:
        break;
    }
  }, []);
  
  // Update search results when searchTerm, events, or filters change
  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, events, handleSearch, organizationFilters, venueFilters, equipmentFilters, statusFilters]);
  
  // Update active filters display
  useEffect(() => {
    const newActiveFilters = [];
    
    organizationFilters.forEach(org => {
      newActiveFilters.push({
        type: 'organization',
        value: org.org_code || org.org_name,
        id: org.org_id
      });
    });
    
    venueFilters.forEach(venue => {
      newActiveFilters.push({
        type: 'venue',
        value: venue.venue_name,
        id: venue.venue_id
      });
    });
    
    equipmentFilters.forEach(eq => {
      newActiveFilters.push({
        type: 'equipment',
        value: eq.equipment_name,
        id: eq.equipment_id
      });
    });
    
    statusFilters.forEach(st => {
      newActiveFilters.push({
        type: 'status',
        value: st.name,
        id: st.reservation_status_id
      });
    });
    
    setActiveFilters(newActiveFilters);
  }, [organizationFilters, venueFilters, equipmentFilters, statusFilters]);

  

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
      const result = await saveReservation(formData, selectedReservation, modalEdit);

      if (result.success) {
        toast.success(`Reservation ${modalEdit ? 'updated' : 'created'} successfully!`);
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
      } else {
        console.error('[RESERVATION ACTION ERROR]', result.error);
        toast.error(`Failed to ${modalEdit ? 'update' : 'create'} reservation: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      // Catch any unexpected errors from the flow itself, not from Supabase via service
      console.error('[UNEXPECTED RESERVATION FLOW ERROR]', err);
      toast.error(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
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
    if (!selectedReservation?.reservation_id) {
      toast.error('No reservation selected for deletion.');
      return;
    }
    try {
      setLoading(true);
      const result = await deleteReservationService(selectedReservation.reservation_id);

      if (result.success) {
        toast.success('Reservation deleted successfully!');
        // Close modals and refresh data
        setDeleteConfirmOpen(false);
        setModalOpen(false);
        setSelectedReservation(null);
        fetchReservations();
      } else {
        console.error('[DELETE RESERVATION ERROR]', result.error);
        toast.error(`Failed to delete reservation: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      // Catch any unexpected errors from the flow itself
      console.error('[UNEXPECTED DELETE FLOW ERROR]', err);
      toast.error(`An unexpected error occurred during deletion: ${err.message || 'Unknown error'}`);
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
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex gap-2">
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
            
            {/* Filter Dropdown/Popover */}
            <div className="flex items-center gap-2">
              <FilterPopover 
                open={filterDropdownOpen}
                onOpenChange={setFilterDropdownOpen}
                organizations={organizations}
                venues={venues}
                equipmentList={equipmentList}
                statuses={statuses}
                organizationFilters={organizationFilters}
                setOrganizationFilters={setOrganizationFilters}
                venueFilters={venueFilters}
                setVenueFilters={setVenueFilters}
                equipmentFilters={equipmentFilters}
                setEquipmentFilters={setEquipmentFilters}
                statusFilters={statusFilters}
                setStatusFilters={setStatusFilters}
                statusLabelMap={statusLabelMap}
              />
            </div>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Active filters:</span>
            {activeFilters.map((filter, index) => (
              <Badge 
                key={`${filter.type}-${filter.id}-${index}`} 
                variant="secondary"
                className="flex items-center gap-1 text-xs px-2 py-1"
              >
                <span className="font-medium">{filter.type}:</span> {filter.value}
                <button 
                  onClick={() => removeFilter(filter.type, filter.id)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6 px-2" 
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
      {/* Search bar has been moved to the header */}
      {/* Modal for create/edit */}
      <ReservationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedReservation(null); setModalView(false); setModalEdit(false); }}
        onSubmit={handleModalSubmit}
        onDelete={handleModalDelete}
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
            toolbar: (props) => <CustomToolbar {...props} view={view} />
          }}
          eventPropGetter={(event) => {
            // Get status ID from event data
            const statusId = event.rawData?.reservation_status_id || 
              (event.status === 'Reserved' || event.status === 'Approved' ? 1 :
               event.status === 'Rejected' ? 2 :
               event.status === 'Pending' ? 3 :
               event.status === 'Cancelled' ? 4 : 3);
            
            // Single background color for all events
            const backgroundColor = '#f8fafc';
            
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

            
            // Add custom class to the event's parent cell
            return {
              style: {
                backgroundColor: backgroundColor,
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.875rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              },
              className: `status-${statusId}`,
            };
          }}
        />
      </div>
    </div>
  );
}

export default EventCalendar;
