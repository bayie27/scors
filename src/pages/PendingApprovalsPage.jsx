import { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { Check, X, Clock, Calendar, MapPin, User, Loader2, Phone, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

// Helper function to format time in 12-hour format
const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export function PendingApprovalsPage() {
  const [groupedReservations, setGroupedReservations] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  
  // Group reservations by date
  const groupReservationsByDate = (reservations) => {
    return reservations.reduce((groups, reservation) => {
      const date = reservation.activity_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(reservation);
      return groups;
    }, {});
  };

  // Fetch pending reservations (status_id = 3)
  const fetchPendingReservations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reservation')
        .select(`
          *,
          organization:org_id(org_name, org_code),
          venue:venue_id(venue_name),
          equipment:reservation_equipment(equipment_id(equipment_name))
        `)
        .eq('reservation_status_id', 3) // Pending status
        .order('activity_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      setGroupedReservations(groupReservationsByDate(data || []));
    } catch (error) {
      console.error('Error fetching pending reservations:', error);
      toast.error('Failed to load pending reservations');
    } finally {
      setLoading(false);
    }
  };

  // Update reservation status (approve/reject)
  const updateReservationStatus = async (reservationId, newStatusId) => {
    try {
      setUpdating(prev => ({ ...prev, [reservationId]: true }));
      
      const { error } = await supabase
        .from('reservation')
        .update({ 
          reservation_status_id: newStatusId,
          decision_ts: new Date().toISOString()
        })
        .eq('reservation_id', reservationId);

      if (error) throw error;
      
      // Refresh the list after update
      await fetchPendingReservations();
      
      // Show success message
      const statusText = newStatusId === 1 ? 'approved' : 'rejected';
      toast.success(`Reservation ${statusText} successfully`);
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast.error(`Failed to update reservation: ${error.message}`);
    } finally {
      setUpdating(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  // Set up real-time subscription and initial data fetch
  useEffect(() => {
    // Initial fetch
    fetchPendingReservations();

    // Set up real-time subscription
    const subscription = supabase
      .channel('reservation_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservation',
          filter: 'reservation_status_id=eq.3' // Only listen to pending reservations
        },
        (payload) => {
          // Refresh data when there are changes to pending reservations
          fetchPendingReservations();
          
          // Show toast notification for new pending reservations
          if (payload.eventType === 'INSERT') {
            toast.success('New pending reservation received', {
              icon: '🔄'
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <p className="text-gray-600">Loading pending reservations...</p>
        </div>
      </div>
    );
  }

  const reservationDates = Object.keys(groupedReservations).sort((a, b) => new Date(a) - new Date(b));
  
  if (reservationDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <Clock className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Pending Approvals</h2>
        <p className="text-gray-500 max-w-md">
          There are currently no pending reservation requests. Check back later for new submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and manage pending reservation requests
        </p>
      </div>

      <div className="space-y-6">
        {reservationDates.map((date) => {
          const reservations = groupedReservations[date];
          return (
            <div key={date} className="overflow-hidden bg-white shadow sm:rounded-lg">
              <div className="px-4 py-3 sm:px-6 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <li key={reservation.reservation_id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {reservation.purpose || 'No title'}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>
                              {formatTime12Hour(reservation.start_time)} - {formatTime12Hour(reservation.end_time)}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span className="truncate">
                              {reservation.venue?.venue_name || 'No venue specified'}
                            </span>
                          </div>

                          <div className="flex items-start text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span className="font-medium">Officer:</span>
                            </div>
                            <span className="ml-1">
                              {reservation.officer_in_charge || 'Not specified'}
                            </span>
                          </div>
                          {reservation.contact_no && (
                            <div className="flex items-start text-sm text-gray-500">
                              <div className="flex items-center">
                                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span className="font-medium">Contact:</span>
                              </div>
                              <a href={`tel:${reservation.contact_no}`} className="ml-1 text-blue-600 hover:underline">
                                {reservation.contact_no}
                              </a>
                            </div>
                          )}
                          {reservation.reserved_by && (
                            <div className="flex items-start text-sm text-gray-500">
                              <div className="flex items-center">
                                <UserPlus className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span className="font-medium">Reserved By:</span>
                              </div>
                              <span className="ml-1">
                                {reservation.reserved_by}
                              </span>
                            </div>
                          )}
                          {reservation.organization && (
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="font-medium">
                                {reservation.organization.org_name} ({reservation.organization.org_code})
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {reservation.equipment?.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-500">Equipment:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {reservation.equipment.map(({ equipment_id }) => (
                                <span key={equipment_id.equipment_id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {equipment_id.equipment_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => updateReservationStatus(reservation.reservation_id, 1)} // Approve
                          disabled={updating[reservation.reservation_id]}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating[reservation.reservation_id] ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1.5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => updateReservationStatus(reservation.reservation_id, 2)} // Reject
                          disabled={updating[reservation.reservation_id]}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating[reservation.reservation_id] ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-1.5" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Requested:</span> {formatDistanceToNow(new Date(reservation.reservation_ts), { addSuffix: true })}
                      <span className="mx-1">•</span>
                      <span className="text-gray-400">
                        {format(parseISO(reservation.reservation_ts), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PendingApprovalsPage;