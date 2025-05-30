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

  // Fetch lookup data for form
  const fetchLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: v, error: vErr }, { data: e, error: eErr }, { data: s, error: sErr }] = await Promise.all([
        supabase.from('venue').select('*'),
        supabase.from('equipment').select('*'),
        supabase.from('reservation_status').select('*'),
      ]);
      console.log('Venues:', v, 'Error:', vErr);
      console.log('Equipment:', e, 'Error:', eErr);
      setVenues(v || []);
      setEquipmentList(e || []);
      setStatuses(s || []);
      setError(null);
    } catch (err) {
      setError('Failed to load lookup data.');
      console.error('Lookup fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reservations from the database
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const { data: reservations, error: fetchError } = await supabase
        .from('reservation')
        .select(`
          *,
          venue:venue_id(*),
          equipment:equipment_id(*),
          status:reservation_status_id(*)
        `);

      if (fetchError) throw fetchError;

      // Transform reservations to calendar events
      const formattedEvents = reservations.map(reservation => {
        // Combine date and time fields
        const startDateTime = new Date(reservation.activity_date);
        const [startHours, startMinutes] = reservation.start_time.split(':');
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
        
        const endDateTime = new Date(reservation.activity_date);
        const [endHours, endMinutes] = reservation.end_time.split(':');
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));
        
        return {
          id: reservation.reservation_id,
          title: reservation.purpose || 'Untitled Reservation',
          start: startDateTime,
          end: endDateTime,
          resource: reservation.venue_id ? `Venue ${reservation.venue_id}` : 
                  (reservation.equipment_id ? `Equipment ${reservation.equipment_id}` : 'No Location'),
          description: `Reserved by: ${reservation.reserved_by || 'Unknown'}\n` +
                     `Contact: ${reservation.contact_no || 'N/A'}`,
          status: reservation.reservation_status_id || 1, // Default to pending
          participants: 1, // Default value since not in schema
          allDay: false,
          rawData: reservation // Include raw data in case needed
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
  }, []);

  // Load reservations on component mount
  useEffect(() => {
    fetchLookups();
    fetchReservations();
  }, [fetchLookups, fetchReservations]);

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

  // Handle when an event is selected
  // Open modal to edit reservation
  const handleSelectEvent = useCallback((event) => {
    setSelectedReservation({ ...event.rawData });
    setModalEdit(true);
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
    setModalOpen(true);
  }, []);

  // Handle navigation between months/weeks/days
  const onNavigate = useCallback((newDate) => setDate(newDate), []);

  // Handle view change
  const onView = useCallback((newView) => setView(newView), []);

  // Custom event component
  const EventComponent = useCallback(({ event }) => (
    <div className="p-1 overflow-hidden">
      <div 
        className={`border-l-4 p-2 rounded ${
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
        {event.resource && (
          <div className="text-xs text-gray-500 mt-1 truncate">{event.resource}</div>
        )}
      </div>
    </div>
  ), []);

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
  const handleModalSubmit = async (form) => {
    // Get current user from Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in to create a reservation.');
      return;
    }
    // Find user_id in your user table by email
    const { data: userRows, error: userError } = await supabase
      .from('user')
      .select('user_id')
      .eq('whitelisted_email', user.email)
      .single();
    if (!userRows || userError) {
      alert('No matching user record found for your email.');
      return;
    }
    // Remove reservation_type_id if present
    const { reservation_type_id, ...formWithoutType } = form;
    // Set reservation_status_id to 'Pending' for new reservations
    let statusId = null;
    if (!modalEdit && statuses && statuses.length > 0) {
      const pendingStatus = statuses.find(s => s.name && s.name.toLowerCase() === 'pending');
      statusId = pendingStatus ? pendingStatus.reservation_status_id : statuses[0].reservation_status_id;
    }
    // Prepare reservation data
    const reservationData = {
      ...form,
      user_id: userRows.user_id,
      venue_id: form.venue_id === '' ? null : form.venue_id,
      equipment_id: form.equipment_id === '' ? null : form.equipment_id,
      reservation_status_id: modalEdit
        ? (form.reservation_status_id === '' ? null : form.reservation_status_id)
        : statusId,
    };
    if (modalEdit && selectedReservation?.reservation_id) {
      const { error } = await supabase.from('reservation').update(reservationData).eq('reservation_id', selectedReservation.reservation_id);
      if (error) {
        alert('Update failed: ' + error.message);
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase.from('reservation').insert([reservationData]);
      if (error) {
        alert('Insert failed: ' + error.message);
        console.error(error);
        return;
      }
    }
    setModalOpen(false);
    setSelectedReservation(null);
  };
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
    <div className="relative h-[700px] bg-white p-4 rounded-lg shadow">
      {/* Modal for create/edit */}
      <ReservationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedReservation(null); }}
        onSubmit={handleModalSubmit}
        onDelete={modalEdit ? handleModalDelete : undefined}
        initialData={selectedReservation}
        venues={venues}
        equipmentList={equipmentList}


        isEdit={modalEdit}
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
  );



  return (
    <div className="h-[700px] bg-white p-4 rounded-lg shadow">
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
  );
}
