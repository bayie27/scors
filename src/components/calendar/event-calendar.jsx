import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../../supabase-client';
import ReservationModal from './ReservationModal';

// Set up the localizer by providing the required date-fns functions
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
  // Lookup data
  const [venues, setVenues] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  const [statuses, setStatuses] = useState([]);

  // ...existing state

  const [events, setEvents] = useState([]);
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

  // Custom toolbar (no refresh button)
  const CustomToolbar = useCallback(({ onView, onNavigate, label }) => {
    return (
      <div className="flex justify-between items-center mb-4">
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
        <div className="flex space-x-1 items-center">
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
    );
  }, [view]);

  // Handle create/edit reservation
  const handleModalSubmit = useCallback(async (formData) => {
    try {
      if (!formData.org_id) {
        throw new Error('Please select an organization');
      }

      if (!formData.activity_date || !formData.start_time || !formData.end_time) {
        throw new Error('Please fill in all required date and time fields');
      }

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
      
      // Refresh the events and close modal
      fetchReservations();
      setModalOpen(false);
      setSelectedReservation(null);
      
    } catch (err) {
      console.error('Error creating/editing reservation:', err);
      alert(`Failed to ${modalEdit ? 'update' : 'create'} reservation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [modalEdit, selectedReservation, fetchReservations]);

  // Handle delete
  const handleModalDelete = async () => {
    if (selectedReservation?.reservation_id) {
      await supabase.from('reservation').delete().eq('reservation_id', selectedReservation.reservation_id);
    }
    setModalOpen(false);
    setSelectedReservation(null);
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
          events={events}
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
