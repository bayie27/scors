import { useState, useEffect, useRef, useCallback } from 'react';
// Remove createPortal import since we'll use a different approach
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search as SearchIcon, 
  X, 
  Edit as EditIcon, 
  Trash as TrashIcon,
  Upload,
  ImageIcon,
  Loader2,
  SquareStack,
} from 'lucide-react';
import { AssetCard } from '@/components/cards/asset-card';
import { equipmentService } from '@/services/equipment-service';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
// Form schema is now handled in dialog components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddEquipmentDialog } from '@/components/equipment/AddEquipmentDialog';
import { EditEquipmentDialog } from '@/components/equipment/EditEquipmentDialog';

// Simple image carousel for equipment modal
function EquipmentImageCarousel({ images = [] }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  const goPrev = (e) => { e.stopPropagation(); setIdx(idx === 0 ? images.length - 1 : idx - 1); };
  const goNext = (e) => { e.stopPropagation(); setIdx(idx === images.length - 1 ? 0 : idx + 1); };
  return (
    <div className="relative w-full h-64 bg-black">
      <img src={images[idx]} alt="Equipment" className="w-full h-64 object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <span key={i} className={`block w-2 h-2 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50'}`}></span>
          ))}
        </div>
      )}
    </div>
  );
}

// Map equipment status to icons
function StatusIcon({ status, ...props }) {
  switch ((status || '').toLowerCase()) {
    case 'available': return <PackageCheck {...props} />;
    case 'in use': return <PackageOpen {...props} />;
    default: return <SquareStack {...props} />;
  }
}


export function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false);
  const [isEditEquipmentDialogOpen, setIsEditEquipmentDialogOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // Reference to the full-screen image modal element
  const fullScreenImageRef = useRef(null);
  const subscriptionRef = useRef(null);
  
  // Function to open the full-screen image modal
  const openFullScreenImage = (imageUrl) => {
    if (!fullScreenImageRef.current) {
      // Create the modal container if it doesn't exist
      const modalContainer = document.createElement('div');
      modalContainer.id = 'full-screen-image-modal';
      modalContainer.className = 'fixed inset-0 z-[9999] flex items-center justify-center';
      modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      modalContainer.style.backdropFilter = 'blur(4px)';
      
      // Function to close the modal
      const closeModal = () => {
        if (fullScreenImageRef.current) {
          document.body.removeChild(fullScreenImageRef.current);
          fullScreenImageRef.current = null;
          
          // Remove the ESC key listener when modal is closed
          document.removeEventListener('keydown', handleEscKey);
        }
      };
      
      // Create the modal content
      modalContainer.innerHTML = `
        <div class="absolute inset-0 cursor-pointer" id="modal-backdrop"></div>
        <div class="relative z-10 max-w-[90vw] max-h-[90vh]">
          <button class="absolute -top-12 right-0 bg-transparent text-white hover:bg-white/20 rounded-full p-2 transition-colors" id="close-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <img src="${imageUrl}" alt="Full-screen equipment view" class="max-h-[80vh] max-w-[90vw] object-contain rounded shadow-lg" style="background-color: transparent;" />
          <div class="text-white text-center mt-4 text-sm opacity-70">Click anywhere outside the image to close</div>
        </div>
      `;
      
      // Add event listeners
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeModal();
        }
      };
      
      // Append the modal to the body
      document.body.appendChild(modalContainer);
      fullScreenImageRef.current = modalContainer;
      
      // Add event listeners after the modal is in the DOM
      document.addEventListener('keydown', handleEscKey, true);
      
      // Add click event listeners
      setTimeout(() => {
        const backdrop = document.getElementById('modal-backdrop');
        const closeButton = document.getElementById('close-button');
        
        if (backdrop) {
          backdrop.addEventListener('click', closeModal);
        }
        
        if (closeButton) {
          closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeModal();
          });
        }
      }, 0);
    }
  };

  const fetchEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get equipment list from service
      const data = await equipmentService.getEquipment();
      console.log('Raw equipment data:', data);
      
      // Process the data to enhance it for UI display
      const processedData = await Promise.all(data.map(async (item) => {
        // Check if item already has a complete image URL
        if (item.image_url && !item.image_url.startsWith('http')) {
          // Get a full URL for the image if not already complete
          const fullImageUrl = await equipmentService.getFullImageUrl(item.image_url);
          return { ...item, image_url: fullImageUrl };
        }
        return item;
      }));
      
      console.log('Processed equipment data:', processedData);
      setEquipment(processedData);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
      toast.error('Failed to load equipment');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddEquipmentSubmit = async (equipmentData, imageFile) => {
    try {
      // Show a loading toast that we'll update later
      const toastId = toast.loading('Adding equipment...');
      
      // Create a temporary ID for optimistic UI updates
      const tempId = `temp-${Date.now()}`;
      
      // Create a temporary image URL if an image file is provided
      let tempImageUrl = null;
      if (imageFile) {
        tempImageUrl = URL.createObjectURL(imageFile);
      }
      
      // Create an optimistic version of the equipment for the UI
      const optimisticEquipment = {
        ...equipmentData,
        equipment_id: tempId,
        image_url: tempImageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add the optimistic equipment to the UI immediately
      setEquipment(prev => [optimisticEquipment, ...prev]);
      
      // Actually create the equipment in the background
      await equipmentService.createEquipment(equipmentData, imageFile);
      
      // Update toast to success
      toast.success('Equipment added successfully', { id: toastId });
      
      // The real-time subscription will handle updating the real data
    } catch (error) {
      console.error('Failed to add equipment:', error);
      toast.error('Failed to add equipment: ' + error.message);
      
      // On error, refresh the list to remove any optimistic updates
      fetchEquipment();
    }
  };

  const handleEditEquipmentSubmit = async (equipmentData, imageFile) => {
    try {
      // Show a loading toast that we'll update later
      const toastId = toast.loading('Updating equipment...');
      
      // Create a temporary image URL if an image file is provided
      const tempImageUrl = imageFile ? URL.createObjectURL(imageFile) : null;
      
      // Create an optimistic version of the updated equipment
      const optimisticUpdate = {
        ...equipmentData,
        image_url: tempImageUrl || equipmentData.image_url,
        updated_at: new Date().toISOString()
      };
      
      // Update local state immediately for responsive UI
      setEquipment(prevEquipment => {
        return prevEquipment.map(item => 
          item.equipment_id === equipmentData.equipment_id ? optimisticUpdate : item
        );
      });
      
      // If the equipment is selected in the modal, update it there too
      if (selectedEquipment && selectedEquipment.equipment_id === equipmentData.equipment_id) {
        setSelectedEquipment({
          ...selectedEquipment,
          ...optimisticUpdate
        });
      }
      
      // Perform the actual update in the background
      await equipmentService.updateEquipment(equipmentData, imageFile);
      
      // Update toast to success
      toast.success('Equipment updated successfully', { id: toastId });
      
      // Close the edit dialog
      setIsEditEquipmentDialogOpen(false);
      
      // The real-time subscription will reconcile any differences when the server confirms
    } catch (error) {
      console.error('Failed to update equipment:', error);
      toast.error('Failed to update equipment: ' + error.message);
      
      // Revert the optimistic update by re-fetching data
      fetchEquipment();
    }
  };

  const handleDeleteEquipment = async () => {
    if (!equipmentToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Store the equipment name before deletion for toast message
      const equipmentName = equipmentToDelete.equipment_name;
      const equipmentId = equipmentToDelete.equipment_id;
      
      // Show a loading toast that we'll update later
      const toastId = toast.loading(`Deleting ${equipmentName}...`);
      
      // Optimistic UI update - immediately remove from state
      setEquipment(prevEquipment => {
        return prevEquipment.filter(item => item.equipment_id !== equipmentId);
      });
      
      // If the deleted equipment is currently selected, close the detail modal
      if (selectedEquipment && selectedEquipment.equipment_id === equipmentId) {
        setSelectedEquipment(null);
      }
      
      // Close the delete confirmation dialog
      setIsDeleteDialogOpen(false);
      setEquipmentToDelete(null);
      
      // Perform the actual delete in the background (with reservation cancellation)
      const result = await equipmentService.deleteEquipmentWithReservations(equipmentId);
      
      // Show appropriate success message based on whether reservations were affected
      if (result.cancelledReservations > 0) {
        toast.success(`${equipmentName} deleted successfully. ${result.cancelledReservations} reservation(s) have been cancelled.`, { id: toastId, duration: 5000 });
      } else {
        toast.success(`${equipmentName} deleted successfully`, { id: toastId });
      }
      
      // The real-time subscription will handle any state reconciliation if needed
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      toast.error(`Failed to delete equipment: ${error.message || 'Unknown error'}`);
      
      // Revert the optimistic update by re-fetching data
      fetchEquipment();
    } finally {
      setIsDeleting(false);
    }
  };
  
  const confirmDeleteEquipment = async (equipment) => {
    try {
      // Check if equipment has associated reservations before showing delete dialog
      const { count, hasReservations } = await equipmentService.checkEquipmentReservations(equipment.equipment_id);
      
      // Store the equipment to delete
      setEquipmentToDelete({
        ...equipment,
        hasReservations,
        reservationCount: count
      });
      
      // Show the delete confirmation dialog
      setIsDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error checking reservations:', error);
      toast.error('Failed to check associated reservations');
    }
  };

  const handleOpenEditDialog = (equipment) => {
    setEquipmentToEdit(equipment);
    setIsEditEquipmentDialogOpen(true);
  };

  // Initial data fetch and real-time subscription setup
  useEffect(() => {
    fetchEquipment();
    
    // Set up an optimized real-time subscription
    subscriptionRef.current = equipmentService.subscribeToEquipment((payload) => {
      console.log('Equipment changed:', payload);
      
      // Handle the change based on the event type without full refetch
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'INSERT') {
        // Add the new equipment to the state if we don't already have it
        setEquipment(prevEquipment => {
          // Check if we already have this record from optimistic update
          // by matching actual ID or checking if we have a temp record with matching name
          const exists = prevEquipment.some(item => 
            item.equipment_id === newRecord.equipment_id ||
            (item.equipment_id.toString().startsWith('temp-') && 
             item.equipment_name === newRecord.equipment_name)
          );
          
          if (exists) {
            // Replace any temporary record with the real server version
            return prevEquipment.map(item => {
              if (item.equipment_id === newRecord.equipment_id || 
                 (item.equipment_id.toString().startsWith('temp-') && 
                  item.equipment_name === newRecord.equipment_name)) {
                return { 
                  ...newRecord,
                  // Preserve the image URL if it's a complete URL
                  image_url: item.image_url && item.image_url.startsWith('http') 
                    ? item.image_url 
                    : newRecord.image_url
                };
              }
              return item;
            });
          }
          
          // Get the image URL and add the new record
          const processNewRecord = async () => {
            if (newRecord.image_url && !newRecord.image_url.startsWith('http')) {
              const fullImageUrl = await equipmentService.getFullImageUrl(newRecord.image_url);
              setEquipment(prev => [{ ...newRecord, image_url: fullImageUrl }, ...prev]);
            } else {
              setEquipment(prev => [newRecord, ...prev]);
            }
          };
          
          processNewRecord();
          return prevEquipment; // Return current state, async update will happen later
        });
      } 
      else if (eventType === 'UPDATE') {
        // Process the updated record to ensure it has a complete image URL
        const processUpdatedRecord = async () => {
          let fullImageUrl = newRecord.image_url;
          
          if (newRecord.image_url && !newRecord.image_url.startsWith('http')) {
            fullImageUrl = await equipmentService.getFullImageUrl(newRecord.image_url);
          }
          
          const updatedRecord = { ...newRecord, image_url: fullImageUrl };
          
          // Update the equipment in the state
          setEquipment(prevEquipment => {
            return prevEquipment.map(item => 
              item.equipment_id === newRecord.equipment_id ? updatedRecord : item
            );
          });
          
          // If this equipment is currently selected, update it in the modal
          if (selectedEquipment && selectedEquipment.equipment_id === newRecord.equipment_id) {
            setSelectedEquipment(updatedRecord);
          }
        };
        
        processUpdatedRecord();
      } 
      else if (eventType === 'DELETE') {
        // Remove the equipment from the state
        setEquipment(prevEquipment => {
          return prevEquipment.filter(item => item.equipment_id !== oldRecord.equipment_id);
        });
        
        // If this equipment is currently selected, close the modal
        if (selectedEquipment && selectedEquipment.equipment_id === oldRecord.equipment_id) {
          setSelectedEquipment(null);
        }
      }
    });
    
    return () => {
      // Clean up subscription on unmount
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [fetchEquipment, selectedEquipment]); // Include both dependencies
  
  // Get status text based on asset_status_id
  const getStatusText = (assetStatusId) => {
    switch(assetStatusId) {
      case 1: return 'Available';
      case 2: return 'Not Available';
      case 3: return 'Maintenance';
      case 4: return 'Out of Order';
      default: return 'Unknown';
    }
  };

  // Get status badge color based on asset_status_id
  const getStatusColor = (assetStatusId) => {
    switch(assetStatusId) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-amber-100 text-amber-800 border-amber-200';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 4: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter equipment based on search query
  const filteredEquipment = equipment.filter(item => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (item.equipment_name && item.equipment_name.toLowerCase().includes(query)) ||
      (item.equipment_desc && item.equipment_desc.toLowerCase().includes(query)) ||
      (item.location && item.location.toLowerCase().includes(query))
    );
  });

  // This function is now handled by handleOpenEditDialog

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Equipment Management</h1>
          <p className="text-sm text-gray-500 mt-1">View details and management options for this equipment</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 sm:gap-y-0 sm:space-x-3 w-full sm:w-auto">
          {/* Mobile Search (visible on base, hidden on sm and up) */}
          <div className="relative flex items-center w-full sm:hidden">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search equipment..."
              className="h-10 pl-10 pr-4 py-2 border-gray-300 rounded-md w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Desktop Expandable Search (hidden on base, flex on sm and up) */}
          <div className="relative hidden sm:flex items-center">
            {isSearchOpen ? (
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  ref={searchInputRef} // Keep ref for potential focus needs
                  placeholder="Search..."
                  className="h-10 pl-10 pr-4 py-2 border-gray-300 rounded-md w-40 focus:w-56 transition-all duration-300 ease-in-out"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
                  autoFocus
                />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSearchOpen(true);
                  // Focus the input after it becomes visible
                  setTimeout(() => searchInputRef.current?.focus(), 0);
                }}
                className="text-gray-500 hover:text-gray-700 h-10 w-10"
                aria-label="Search equipment"
              >
                <SearchIcon className="h-10 w-10" />
              </Button>
            )}
          </div>
          
          {/* Add equipment button */}
          <Button
            className="bg-[#07A012] hover:bg-[#058a0e] text-white h-10 w-full sm:w-auto flex items-center justify-center px-4 text-sm sm:text-base group transition-colors"
            onClick={() => setIsAddEquipmentDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5 transition-transform duration-300 ease-in-out group-hover:rotate-90" />
            <span>Add Equipment</span>
          </Button>
        </div>
      </div>
      
      {/* Equipment grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading equipment...</span>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <SquareStack className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No equipment found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first equipment item'}
          </p>
          <Button 
            className="ml-4 bg-green-600 hover:bg-green-700 w-full sm:w-auto whitespace-nowrap"
            onClick={() => alert('Add equipment functionality coming soon')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <AssetCard
              key={item.equipment_id}
              title={item.equipment_name}
              statusId={item.asset_status_id}
              statusText={getStatusText(item.asset_status_id)}
              statusColor={getStatusColor(item.asset_status_id)}
              image={item.image_url || null}
              location={item.location}
              description={item.equipment_desc}
              onView={() => setSelectedEquipment(item)}
              onEdit={() => handleOpenEditDialog(item)}
              onDelete={() => confirmDeleteEquipment(item)}
              className="h-full"
            />
          ))}
        </div>
      )}
      
      {/* Equipment detail modal */}
      {selectedEquipment && (
        <Dialog open={!!selectedEquipment} onOpenChange={(newOpenState) => {
            if (!newOpenState) { // Dialog is trying to close
              setSelectedEquipment(null); // This will make open={!!selectedEquipment} false
              // If the main dialog is closing, also close the full-screen image if it's open
              if (fullScreenImageRef.current) {
                document.body.removeChild(fullScreenImageRef.current);
                fullScreenImageRef.current = null;
              }
            }
            // If newOpenState is true, it means something is trying to open it.
            // The `open={!!selectedEquipment}` prop handles this if selectedEquipment is set.
          }}>
          <DialogContent 
            className="max-w-3xl max-h-[65vh] overflow-y-auto p-0"
            aria-describedby="equipment-details-description"
            onPointerDownOutside={(e) => {
              if (fullScreenImageRef.current) {
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              if (fullScreenImageRef.current) {
                e.preventDefault();
                // The direct DOM approach will handle ESC key via its own event listener
              }
            }}
          >
            {/* Header */}
            <div className="border-b pb-4 px-6 pt-6">
              <DialogTitle className="text-2xl font-bold text-gray-900">{selectedEquipment.equipment_name}</DialogTitle>
              <DialogDescription id="equipment-details-description" className="mt-1 text-sm text-gray-500">
                View details and management options for this equipment
              </DialogDescription>
              <div className="mt-1">
                <Badge variant="outline" className={`text-xs ${getStatusColor(selectedEquipment.asset_status_id)}`}>
                  {getStatusText(selectedEquipment.asset_status_id)}
                </Badge>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[65vh]">
              {/* Image */}
              <div className="px-5 py-3">
                <div 
                  className="overflow-hidden rounded-lg border border-gray-200 cursor-pointer relative group"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    if (selectedEquipment.image_url) {
                      openFullScreenImage(selectedEquipment.image_url);
                    }
                  }}
                >
                  {selectedEquipment.image_url ? (
                    <>
                      <img 
                        src={selectedEquipment.image_url || '/images/fallback-equipment.png'} 
                        alt={selectedEquipment.equipment_name}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          console.log('Modal image failed to load:', e.target.src);
                          e.target.onerror = null; // Prevent infinite error loops
                          e.target.src = '/images/fallback-equipment.png';
                        }}
                        crossOrigin="anonymous" // Add CORS support for Supabase storage
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white bg-black bg-opacity-50 rounded-full p-2">
                          <ImageIcon className="h-6 w-6" />
                          <span className="sr-only">View Full Size</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                </div>
              </div>
      
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 gap-6">
                  {/* Description */}
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedEquipment.equipment_desc || 'No description available for this equipment.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex justify-end gap-3 w-full">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button 
                      variant="outline"
                      onClick={() => handleOpenEditDialog(selectedEquipment)}
                      className="h-10 px-4 flex items-center gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor" className="text-blue-600 mr-2">
                        <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                      Edit Equipment
                    </Button>
                    <div className="border-l border-gray-200 h-6 self-center hidden sm:block"></div>
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300"
                      onClick={() => confirmDeleteEquipment(selectedEquipment)}
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="whitespace-nowrap">Delete Equipment</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Equipment Dialog */}
      <AddEquipmentDialog 
        open={isAddEquipmentDialogOpen}
        onOpenChange={setIsAddEquipmentDialogOpen}
        onSubmitSuccess={handleAddEquipmentSubmit}
      />
      
      {/* Edit Equipment Dialog */}
      {equipmentToEdit && (
        <EditEquipmentDialog
          open={isEditEquipmentDialogOpen}
          onOpenChange={setIsEditEquipmentDialogOpen}
          equipment={equipmentToEdit}
          onSubmitSuccess={handleEditEquipmentSubmit}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Delete Equipment
            </DialogTitle>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 p-3 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <p className="text-sm font-medium">
                This action cannot be undone. This will permanently delete the equipment.
              </p>
            </div>
            
            {equipmentToDelete && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to delete <span className="font-semibold">{equipmentToDelete.equipment_name}</span>?
                </p>
                
                {equipmentToDelete.hasReservations && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-red-800">Warning: Associated Reservations</h4>
                        <div className="mt-1 text-sm text-red-700">
                          <p>This equipment has <strong>{equipmentToDelete.reservationCount}</strong> active reservation{equipmentToDelete.reservationCount !== 1 ? 's' : ''}.</p>
                          <p className="mt-1">If you delete this equipment, all associated reservations will be automatically marked as <strong>"Cancelled"</strong>.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-6 pt-4 border-t bg-gray-50 flex justify-end gap-3">
            <Button
              variant="ghost"
              className="h-10 px-4 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setEquipmentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteEquipment}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Equipment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* NOTE: EditEquipmentDialog is already rendered above */}
      
      {/* We don't need the Portal here anymore - using imperative DOM approach */}
    </div>
  );
}