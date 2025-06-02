import { useState, useEffect } from 'react';
import { supabase } from '@/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Calendar, Clock, Users, MapPin, Package, AlertCircle, CheckCircle, XCircle, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import ViewMode from '@/components/calendar/ReservationModal/components/ViewMode';
import { STATUS_STYLES } from '@/statusStyles';
import toast from 'react-hot-toast';

export function PendingApprovalsPage() {
  const [pendingReservations, setPendingReservations] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh the reservations list
  const refreshReservations = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch pending reservations, venues, equipment, and organizations
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch pending reservations (status_id = 3)
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservation')
          .select(`
            *,
            venue:venue_id(venue_id, venue_name),
            organization:org_id(org_id, org_name, org_code)
          `)
          .eq('reservation_status_id', 3)
          .order('reservation_ts', { ascending: false });

        if (reservationsError) throw reservationsError;
        
        // Fetch venues
        const { data: venuesData, error: venuesError } = await supabase
          .from('venue')
          .select('*');
        
        if (venuesError) throw venuesError;
        
        // Fetch equipment
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('equipment')
          .select('*');
        
        if (equipmentError) throw equipmentError;
        
        // Fetch organizations
        const { data: orgsData, error: orgsError } = await supabase
          .from('organization')
          .select('*');
        
        if (orgsError) throw orgsError;

        // Process reservations to add equipment_ids array if it doesn't exist
        const processedReservations = reservations.map(res => {
          if (res.equipment_id && !res.equipment_ids) {
            return {
              ...res,
              equipment_ids: [res.equipment_id.toString()]
            };
          }
          return res;
        });

        setPendingReservations(processedReservations);
        setVenues(venuesData);
        setEquipment(equipmentData);
        setOrganizations(orgsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load pending reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger, toast]);

  // Function to handle approving a reservation
  const handleApprove = async (reservation) => {
    try {
      const { error } = await supabase
        .from('reservation')
        .update({
          reservation_status_id: 1, // Approved
          decision_ts: new Date().toISOString()
        })
        .eq('reservation_id', reservation.reservation_id);

      if (error) throw error;

      toast.success(`Reservation for ${reservation.purpose} has been approved.`);

      refreshReservations();
      if (viewDetailsOpen) {
        setViewDetailsOpen(false);
      }
    } catch (error) {
      console.error('Error approving reservation:', error);
      toast.error('Failed to approve reservation');
    }
  };

  // Function to handle rejecting a reservation
  const handleReject = async (reservation) => {
    try {
      const { error } = await supabase
        .from('reservation')
        .update({
          reservation_status_id: 2, // Rejected
          decision_ts: new Date().toISOString()
        })
        .eq('reservation_id', reservation.reservation_id);

      if (error) throw error;

      toast.success(`Reservation for ${reservation.purpose} has been rejected.`);

      refreshReservations();
      if (viewDetailsOpen) {
        setViewDetailsOpen(false);
      }
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      toast.error('Failed to reject reservation');
    }
  };

  // Function to view reservation details
  const handleViewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setViewDetailsOpen(true);
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Format time string to 12-hour format
  const formatTime12Hour = (timeString) => {
    if (!timeString) return 'Not set';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get venue name by ID
  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.venue_id === venueId);
    return venue ? venue.venue_name : 'No venue';
  };

  // Get organization initials for avatar
  const getOrgInitials = (reservation) => {
    if (reservation.organization && reservation.organization.org_code) {
      return reservation.organization.org_code.substring(0, 2).toUpperCase();
    }
    return 'OR';
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pending Approvals</h1>
        <Button
          variant="outline"
          onClick={refreshReservations}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Main content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      ) : (
        <div>
          {/* Filter the reservations based on selected filter */}
          {(() => {
            // Filter the reservations based on the selected filter
            let filteredReservations = [...pendingReservations];
            
            if (filter === 'today') {
              const today = new Date().toISOString().split('T')[0];
              filteredReservations = pendingReservations.filter(res => res.activity_date === today);
            } 
            else if (filter === 'tomorrow') {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split('T')[0];
              filteredReservations = pendingReservations.filter(res => res.activity_date === tomorrowStr);
            }
            else if (filter === 'thisWeek') {
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              
              filteredReservations = pendingReservations.filter(res => {
                const resDate = new Date(res.activity_date);
                return resDate >= startOfWeek && resDate <= endOfWeek;
              });
            }
            
            // Display message if no reservations match the filter
            if (filteredReservations.length === 0) {
              return (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Pending Reservations</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {filter === 'all' && 'There are no reservations waiting for approval.'}
                    {filter === 'today' && 'There are no pending reservations for today.'}
                    {filter === 'tomorrow' && 'There are no pending reservations for tomorrow.'}
                    {filter === 'thisWeek' && 'There are no pending reservations for this week.'}
                  </p>
                </div>
              );
            }
            
            // Display the filtered reservations
            return (
              <div className="grid grid-cols-1 gap-4">
                {filteredReservations.map(reservation => (
                  <Card key={reservation.reservation_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-12 w-12 bg-blue-100 text-blue-700">
                            <AvatarFallback>{getOrgInitials(reservation)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="space-y-1">
                            <h3 className="font-medium text-gray-900">{reservation.purpose}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatDate(reservation.activity_date)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{formatTime12Hour(reservation.start_time)} - {formatTime12Hour(reservation.end_time)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{reservation.venue ? reservation.venue.venue_name : 'No venue'}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>{reservation.organization ? `${reservation.organization.org_code} - ${reservation.organization.org_name}` : 'Unknown organization'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-4 md:mt-0 space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(reservation)}>
                            View Details
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(reservation)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleReject(reservation)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Details Dialog */}
      {selectedReservation && (
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ViewMode
              form={selectedReservation}
              statusName="Pending Approval"
              statusStyles={STATUS_STYLES[3]} /* This is already a string - 'bg-yellow-100 text-yellow-800 border-yellow-200' */
              onClose={() => setViewDetailsOpen(false)}
              onEditView={() => {}} /* Not needed for pending approvals but required by PropTypes */
              onCancel={() => {}} /* Not needed for pending approvals but required by PropTypes */
              onApprove={() => handleApprove(selectedReservation)}
              onReject={() => handleReject(selectedReservation)}
              venues={venues}
              equipmentList={equipment}
              organizations={organizations}
              onDelete={() => {}} /* Adding onDelete prop which is optional but good to have */
            />
            <div className="mt-4 flex justify-end">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
