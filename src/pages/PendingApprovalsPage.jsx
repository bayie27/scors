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
import EditMode from '@/components/calendar/ReservationModal/components/EditMode';
import { STATUS_STYLES } from '@/statusStyles';
import toast from 'react-hot-toast';

// Define ConfirmationModal component here
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText, confirmButtonClass }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </Button>
          <Button onClick={onConfirm} className={`${confirmButtonClass} text-white`}>
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export function PendingApprovalsPage() {
  const [pendingReservations, setPendingReservations] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [currentModalMode, setCurrentModalMode] = useState('view'); // 'view' or 'edit'
  const [editableForm, setEditableForm] = useState(null); // To hold form data during edit
  const [formErrors, setFormErrors] = useState({}); // For edit form validation
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    action: null, // 'approve', 'reject', 'save'
    targetData: null,
    title: '',
    message: '',
    confirmButtonText: 'Confirm',
    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700',
  });

  // Fetch venues, equipment, and organizations (static data)
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
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

        setVenues(venuesData);
        setEquipment(equipmentData);
        setOrganizations(orgsData);
      } catch (error) {
        console.error('Error fetching static data:', error);
        toast.error('Failed to load reference data');
      }
    };

    fetchStaticData();
  }, []); // Only fetch static data once
  
  // Fetch pending reservations with real-time updates
  useEffect(() => {
    setLoading(true);
    
    // Initial fetch of pending reservations
    const fetchPendingReservations = async () => {
      try {
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservation')
          .select(`
            *,
            venue:venue_id (*),
            organization:org_id (*)
          `)
          .eq('reservation_status_id', 3);
        
        if (reservationsError) throw reservationsError;

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
      } catch (error) {
        console.error('Error fetching pending reservations:', error);
        toast.error('Failed to load pending reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingReservations();
    
    // Set up real-time subscription to the reservation table
    const subscription = supabase
      .channel('reservation-changes')
      .on('postgres_changes', 
        { 
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'reservation'
        }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          
          // Refresh the pending reservations list when changes occur
          fetchPendingReservations();
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Only set up subscription once
  
  // Function to initiate approving a reservation
  const handleApprove = (reservation) => {
    setConfirmModalState({
      isOpen: true,
      action: 'approve',
      targetData: reservation,
      title: 'Confirm Approval',
      message: `Are you sure you want to approve the reservation for "${reservation.purpose}"?`,
      confirmButtonText: 'Approve',
      confirmButtonClass: 'bg-green-600 hover:bg-green-700',
    });
  };

  // Function to initiate rejecting a reservation
  const handleReject = (reservation) => {
    setConfirmModalState({
      isOpen: true,
      action: 'reject',
      targetData: reservation,
      title: 'Confirm Rejection',
      message: `Are you sure you want to reject the reservation for "${reservation.purpose}"?`,
      confirmButtonText: 'Reject',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
    });
  };

  // Actual execution functions (will be called by handleExecuteConfirmedAction)
  const executeApproveReservation = async (reservation) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('reservation')
        .update({ 
          reservation_status_id: 1, // Approved
          decision_ts: now
        })
        .eq('reservation_id', reservation.reservation_id);

      if (error) throw error;

      toast.success(`Reservation for ${reservation.purpose} has been approved.`);

      // No need to manually refresh - real-time subscription will handle this
      if (viewDetailsOpen) {
        setViewDetailsOpen(false);
      }
    } catch (error) {
      console.error('Error approving reservation:', error);
      toast.error('Failed to approve reservation');
    }
  };

  const executeRejectReservation = async (reservation) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('reservation')
        .update({ 
          reservation_status_id: 2, // Rejected
          decision_ts: now
        })
        .eq('reservation_id', reservation.reservation_id);

      if (error) throw error;

      toast.success(`Reservation for ${reservation.purpose} has been rejected.`);

      // No need to manually refresh - real-time subscription will handle this
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
    // Ensure all expected fields are present, defaulting if necessary
    const initialFormState = {
      reservation_id: reservation.reservation_id,
      purpose: reservation.purpose || '',
      org_id: reservation.org_id || '',
      activity_date: reservation.activity_date || '',
      start_date: reservation.activity_date || '', // for EditMode compatibility
      end_date: reservation.activity_date || '', // for EditMode compatibility, assuming single day event for pending
      start_time: reservation.start_time || '',
      end_time: reservation.end_time || '',
      venue_id: reservation.venue_id || '',
      equipment_ids: reservation.equipment_ids || [],
      reserved_by: reservation.reserved_by || '',
      officer_in_charge: reservation.officer_in_charge || '',
      contact_no: reservation.contact_no || '',
      reservation_status_id: reservation.reservation_status_id, // Keep original status
      // Include other fields if EditMode expects them, e.g., from initialData in ReservationModal
    };
    setEditableForm(initialFormState);
    setCurrentModalMode('view');
    setFormErrors({}); // Clear any previous errors
    setViewDetailsOpen(true);
  };

  const handleModalEditView = () => {
    setCurrentModalMode('edit');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'equipment_checkbox') {
      const equipmentId = String(value); // Ensure it's a string for comparison
      setEditableForm((prev) => {
        const currentEquipmentIds = prev.equipment_ids ? prev.equipment_ids.map(String) : [];
        let updatedEquipmentIds;
        if (checked) {
          updatedEquipmentIds = [...currentEquipmentIds, equipmentId];
        } else {
          updatedEquipmentIds = currentEquipmentIds.filter(id => id !== equipmentId);
        }
        return { ...prev, equipment_ids: updatedEquipmentIds };
      });
    } else if (name === 'start_date') {
      // If start_date changes, also update activity_date and end_date for simplicity in this context
      setEditableForm((prev) => ({ 
        ...prev, 
        start_date: value, 
        activity_date: value, 
        end_date: value 
      }));
    } else {
      setEditableForm((prev) => ({ ...prev, [name]: value }));
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (name === 'venue_id' && value) {
      setFormErrors(prev => ({ ...prev, venue_equipment: undefined }));
    }
    if (name === 'equipment_checkbox' && checked) {
      setFormErrors(prev => ({ ...prev, venue_equipment: undefined }));
    }
  };

  // Modified to open confirmation modal before submitting
  const handleFormSubmit = async () => {
    if (!editableForm) return;

    // Perform validation first
    const errors = {};
    if (!editableForm.purpose?.trim()) errors.purpose = 'Purpose is required.';
    if (!editableForm.start_date) errors.start_date = 'Date is required.';
    if (!editableForm.start_time) errors.start_time = 'Start time is required.';
    if (!editableForm.end_time) errors.end_time = 'End time is required.';
    if (!editableForm.org_id) errors.org_id = 'Organization is required.';
    if (!editableForm.reserved_by?.trim()) errors.reserved_by = 'Reserved by is required.';
    if (!editableForm.officer_in_charge?.trim()) errors.officer_in_charge = 'Officer in charge is required.';
    if (!editableForm.contact_no?.trim()) errors.contact_no = 'Contact number is required.';
    else {
      const phoneDigits = editableForm.contact_no.replace(/\D/g, '');
      if (!((phoneDigits.startsWith('639') && phoneDigits.length === 12) || (phoneDigits.startsWith('09') && phoneDigits.length === 11))) {
        errors.contact_no = 'Enter a valid PH phone number (e.g., 09xxxxxxxxx or +639xxxxxxxxx).';
      }
    }
    if (!editableForm.venue_id && (!editableForm.equipment_ids || editableForm.equipment_ids.length === 0)) {
      errors.venue_equipment = 'Either a venue or at least one equipment must be selected.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please correct the errors in the form.');
      return;
    }
    setFormErrors({});

    // If validation passes, open confirmation modal
    setConfirmModalState({
      isOpen: true,
      action: 'save',
      targetData: { ...editableForm }, // Pass a copy of the form data
      title: 'Confirm Save Changes',
      message: 'Are you sure you want to save the changes to this reservation?',
      confirmButtonText: 'Save Changes',
      confirmButtonClass: 'bg-blue-600 hover:bg-blue-700',
    });
  };

  const executeSaveReservation = async (formData) => {
    // formData is assumed to be validated already by handleFormSubmit before showing confirmation

    const submissionData = {
      purpose: formData.purpose,
      org_id: formData.org_id,
      activity_date: formData.start_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      venue_id: formData.venue_id || null,
      equipment_ids: formData.equipment_ids || [],
      reserved_by: formData.reserved_by,
      officer_in_charge: formData.officer_in_charge,
      contact_no: String(formData.contact_no).replace(/\D/g, ''), // Ensure contact_no is string before replace
      edit_ts: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('reservation')
        .update(submissionData)
        .eq('reservation_id', formData.reservation_id);

      if (error) throw error;

      toast.success('Reservation updated successfully!');
      setViewDetailsOpen(false); // Close modal
      // The list will refresh due to the real-time subscription
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error(`Failed to update reservation: ${error.message}`);
    }
  };

  const handleExecuteConfirmedAction = async () => {
    const { action, targetData } = confirmModalState;
    setConfirmModalState({ ...confirmModalState, isOpen: false }); // Close modal immediately

    if (!targetData) return;

    if (action === 'approve') {
      await executeApproveReservation(targetData);
    } else if (action === 'reject') {
      await executeRejectReservation(targetData);
    } else if (action === 'save') {
      await executeSaveReservation(targetData);
    }
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
    return 'OR'; // Default initials
  };

  // Main return for PendingApprovalsPage component
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pending Approvals</h1>
      </div>

      {/* No filter buttons */}

      {/* Main content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      ) : (
        <div>
          {(() => {
            // Group reservations by date
            const reservationsByDate = {};
            
            // Sort reservations into date groups
            pendingReservations.forEach(reservation => {
              const date = reservation.activity_date;
              if (!reservationsByDate[date]) {
                reservationsByDate[date] = [];
              }
              reservationsByDate[date].push(reservation);
            });
            
            // Get dates and sort them chronologically
            const dates = Object.keys(reservationsByDate).sort();
            
            // No reservations to show
            if (dates.length === 0) {
              return (
                <div className="text-center py-10">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No pending reservations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All reservation requests have been processed. Check back later for new requests.
                  </p>
                </div>
              );
            }
            
            // Display reservations grouped by date
            return (
              <div className="space-y-8">
                {dates.map(date => (
                  <div key={date} className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
                      {formatDate(date)}
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {reservationsByDate[date].map(reservation => (
                        <Card key={reservation.reservation_id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="space-y-1">
                                  <h3 className="font-medium text-gray-900">{reservation.purpose}</h3>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                                      <span>{formatTime12Hour(reservation.start_time)} - {formatTime12Hour(reservation.end_time)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      {reservation.venue ? (
                                        <>
                                          <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                                          <span>{reservation.venue.venue_name}</span>
                                        </>
                                      ) : reservation.equipment_ids && reservation.equipment_ids.length > 0 ? (
                                        <>
                                          <Package className="h-4 w-4 mr-1.5 text-gray-400" />
                                          <span>
                                            {reservation.equipment_ids.map(id => equipment.find(e => String(e.equipment_id) === String(id))?.equipment_name || `Eq-${id}`).join(', ')}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                                          <span>No venue or equipment</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center">
                                      <Users className="h-4 w-4 mr-1.5 text-gray-400" />
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
                                  Approve
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleReject(reservation)}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Details Dialog */}
      {selectedReservation && viewDetailsOpen && (
        currentModalMode === 'view' ? (
          <ViewMode
            form={selectedReservation} 
            statusName="Pending"
            statusStyles={STATUS_STYLES[3]}
            onClose={() => setViewDetailsOpen(false)}
            onEditView={handleModalEditView} 
            onCancel={() => {}} 
            onApprove={() => handleApprove(selectedReservation)} 
            onReject={() => handleReject(selectedReservation)}   
            venues={venues}
            equipmentList={equipment}
            organizations={organizations}
            onDelete={() => {}} 
          />
        ) : (
          <EditMode
            form={editableForm} 
            onClose={() => setCurrentModalMode('view')} 
            onSubmit={handleFormSubmit} 
            isEdit={true} 
            venues={venues}
            equipmentList={equipment}
            organizations={organizations}
            handleChange={handleFormChange} 
            errors={formErrors} 
          />
        )
      )}

      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
        onConfirm={handleExecuteConfirmedAction} // We will define this next
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmButtonText={confirmModalState.confirmButtonText}
        confirmButtonClass={confirmModalState.confirmButtonClass}
      />
    </div>
  );
}
