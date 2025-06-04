import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase-client';
import { Check, X, Clock, Calendar, MapPin, User, Loader2, Phone, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

// Helper function to format time in 12-hour format
const formatTime12Hour = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export function PendingApprovalsPage() {
  const [groupedReservations, setGroupedReservations] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [filter, setFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);

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

  // Filter reservations based on selected filter
  const filterReservations = (reservations) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    return reservations.filter(reservation => {
      const resDate = new Date(reservation.activity_date);
      
      switch(filter) {
        case 'today':
          return resDate.toDateString() === today.toDateString();
        case 'tomorrow':
          return resDate.toDateString() === tomorrow.toDateString();
        case 'thisWeek':
          return resDate >= today && resDate <= endOfWeek;
        case 'all':
        default:
          return true;
      }
    });
  };

  // Fetch pending reservations (status_id = 3)
  const fetchPendingReservations = useCallback(async () => {
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
  }, []);

  // Handle approve action
  const handleApprove = async (reservation) => {
    setUpdating(prev => ({ ...prev, [reservation.reservation_id]: true }));
    
    try {
      const { error } = await supabase
        .from('reservation')
        .update({ 
          reservation_status_id: 1, // Approved status
          updated_at: new Date().toISOString()
        })
        .eq('reservation_id', reservation.reservation_id);

      if (error) throw error;

      await fetchPendingReservations();
      toast.success('Reservation approved successfully');
    } catch (error) {
      console.error('Error approving reservation:', error);
      toast.error('Failed to approve reservation');
    } finally {
      setUpdating(prev => ({ ...prev, [reservation.reservation_id]: false }));
    }
  };

  // Handle reject action
  const handleReject = async (reservation) => {
    setUpdating(prev => ({ ...prev, [reservation.reservation_id]: true }));
    
    try {
      const { error } = await supabase
        .from('reservation')
        .update({ 
          reservation_status_id: 2, // Rejected status
          updated_at: new Date().toISOString()
        })
        .eq('reservation_id', reservation.reservation_id);

      if (error) throw error;

      await fetchPendingReservations();
      setSelectedReservation(null);
      toast.success('Reservation rejected successfully');
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      toast.error('Failed to reject reservation');
    } finally {
      setUpdating(prev => ({ ...prev, [reservation.reservation_id]: false }));
    }
  };

  // Fetch pending reservations on component mount and set up real-time subscription
  useEffect(() => {
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
          filter: 'reservation_status_id=eq.3',
        },
        () => {
          fetchPendingReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchPendingReservations]);


  // Filter and sort reservation dates
  const reservationDates = Object.keys(groupedReservations)
    .sort((a, b) => new Date(a) - new Date(b))
    .filter(date => {
      const reservations = groupedReservations[date];
      return filterReservations(reservations).length > 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (reservationDates.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'There are no pending reservations to approve.'
              : `No pending reservations match the selected filter.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pending Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and manage pending reservation requests
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'today' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('today')}
        >
          Today
        </Button>
        <Button 
          variant={filter === 'tomorrow' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('tomorrow')}
        >
          Tomorrow
        </Button>
        <Button 
          variant={filter === 'thisWeek' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('thisWeek')}
        >
          This Week
        </Button>
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
                                <span key={equipment_id?.equipment_id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {equipment_id?.equipment_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => handleApprove(reservation)}
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
                          onClick={() => handleReject(reservation)}
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
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Requested {formatDistanceToNow(new Date(reservation.reservation_ts), { addSuffix: true })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
        {selectedReservation && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reservation Details</DialogTitle>
              <DialogDescription>
                Review the details of this reservation request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{selectedReservation.purpose || 'No title'}</h3>
                <p className="text-sm text-gray-500">
                  {selectedReservation.organization?.org_name || 'No organization'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date</p>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(selectedReservation.activity_date), 'EEEE, MMMM d, yyyy')}
                      <br />
                      {formatTime12Hour(selectedReservation.start_time)} - {formatTime12Hour(selectedReservation.end_time)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Time</p>
                    <p className="text-sm text-gray-500">
                      {formatTime12Hour(selectedReservation.start_time)} - {formatTime12Hour(selectedReservation.end_time)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Venue</p>
                    <p className="text-sm text-gray-500">
                      {selectedReservation.venue?.venue_name || 'No venue selected'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Requested by</p>
                    <p className="text-sm text-gray-500">
                      {selectedReservation.reserved_by || 'Unknown user'}
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedReservation.additional_notes && (
                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-900 mb-1">Additional Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedReservation.additional_notes}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedReservation(null)}
                >
                  Close
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleReject(selectedReservation)}
                  disabled={updating[selectedReservation.reservation_id]}
                >
                  {updating[selectedReservation.reservation_id] ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Reject
                </Button>
                <Button 
                  onClick={() => handleApprove(selectedReservation)}
                  disabled={updating[selectedReservation.reservation_id]}
                >
                  {updating[selectedReservation.reservation_id] ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
                <p className="text-sm text-gray-500">
                  {selectedReservation.additional_info || 'No additional information provided.'}
                </p>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <div className="flex justify-between w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedReservation(null)}
                  disabled={updating[selectedReservation.reservation_id]}
                >
                  Close
                </Button>
                <div className="space-x-2">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleReject(selectedReservation)}
                    disabled={updating[selectedReservation.reservation_id]}
                  >
                    {updating[selectedReservation.reservation_id] ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedReservation)}
                    disabled={updating[selectedReservation.reservation_id]}
                  >
                    {updating[selectedReservation.reservation_id] ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

export default PendingApprovalsPage;