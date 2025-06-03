import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false);
  const [isEditEquipmentDialogOpen, setIsEditEquipmentDialogOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const subscriptionRef = useRef(null);

  const fetchEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get equipment list from service
      const data = await equipmentService.getEquipment();
      console.log('Raw equipment data:', data);
      
      // Process the equipment data to ensure image URLs are properly formatted
      const processedData = data.map(item => {
        // Skip processing for items without an image_url
        if (!item.image_url) return { ...item, image_url: null };
        
        // Process base64 images directly
        if (typeof item.image_url === 'string' && item.image_url.startsWith('data:')) {
          return { ...item };
        }
        
        // Get a proper public URL for the image using our helper function
        const imageUrl = equipmentService.getFullImageUrl(item.image_url);
        console.log(`Processing image for ${item.equipment_name}:`, { original: item.image_url, processed: imageUrl });
        
        return { ...item, image_url: imageUrl };
      });
      
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
      setIsLoading(true);
      await equipmentService.createEquipment(equipmentData, imageFile);
      toast.success('Equipment added successfully');
      fetchEquipment(); // Refresh the equipment list
    } catch (error) {
      console.error('Failed to add equipment:', error);
      toast.error('Failed to add equipment: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEquipmentSubmit = async (equipmentData, imageFile) => {
    try {
      setIsLoading(true);
      const updatedEquipment = await equipmentService.updateEquipment(equipmentData, imageFile);
      toast.success('Equipment updated successfully');
      fetchEquipment(); // Refresh the equipment list
      if (selectedEquipment && selectedEquipment.equipment_id === equipmentData.equipment_id) {
        // Update the selected equipment if it's currently displayed in the modal
        const updatedImageUrl = imageFile ? await equipmentService.getFullImageUrl(updatedEquipment.image_url) : selectedEquipment.image_url;
        setSelectedEquipment({
          ...updatedEquipment,
          image_url: updatedImageUrl
        });
      }
    } catch (error) {
      console.error('Failed to update equipment:', error);
      toast.error('Failed to update equipment: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!equipmentToDelete) return;
    
    try {
      setIsDeleting(true);
      await equipmentService.deleteEquipment(equipmentToDelete.equipment_id);
      
      // If the deleted equipment is currently selected, close the detail modal
      if (selectedEquipment && selectedEquipment.equipment_id === equipmentToDelete.equipment_id) {
        setSelectedEquipment(null);
      }
      
      // Close the delete confirmation dialog
      setIsDeleteDialogOpen(false);
      setEquipmentToDelete(null);
      
      toast.success(`${equipmentToDelete.equipment_name} deleted successfully`);
      fetchEquipment(); // Refresh the equipment list
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      toast.error(`Failed to delete equipment: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const confirmDeleteEquipment = (equipment) => {
    setEquipmentToDelete(equipment);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenEditDialog = (equipment) => {
    setEquipmentToEdit(equipment);
    setIsEditEquipmentDialogOpen(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchEquipment();
    
    // Set up real-time subscription
    subscriptionRef.current = equipmentService.subscribeToEquipment((payload) => {
      console.log('Equipment changed:', payload);
      fetchEquipment();
    });
    
    return () => {
      // Clean up subscription on unmount
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [fetchEquipment]);

  // Filter equipment based on search query - updated to match venue page pattern

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
        <h1 className="text-2xl font-bold">Equipment Management</h1>
        <div className="flex items-center gap-4">
          {/* Search pill - icon only by default, expands to input on click */}
          <div className="h-10 flex items-center">
            <div
              className={`flex items-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden group ${isSearchExpanded ? 'border border-gray-200 shadow-sm bg-white rounded-full w-64 px-4 py-2 justify-start' : 'w-10 h-10 p-0 justify-center border-0 shadow-none bg-none'}`}
              onClick={() => {
                if (!isSearchExpanded) {
                  setIsSearchExpanded(true);
                  setTimeout(() => searchInputRef.current && searchInputRef.current.focus(), 100);
                }
              }}
              tabIndex={0}
              onBlur={e => {
                // Only collapse if clicking outside
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsSearchExpanded(false);
                }
              }}
              style={{ transform: 'translateZ(0)' }} /* Force GPU acceleration */
            >
              <SearchIcon className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-all duration-300 ease-in-out ${isSearchExpanded ? 'ml-0' : 'mx-auto'} ${!isSearchExpanded ? '!bg-none !shadow-none !rounded-none' : ''}`} />
              <div className={`relative flex-1 transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  className={`bg-transparent outline-none border-none text-sm placeholder-gray-400 w-full ml-2 ${isSearchExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                  style={{ minWidth: 0 }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onFocus={() => setIsSearchExpanded(true)}
                />
              </div>
              <button
                tabIndex={0}
                onClick={e => {
                  e.stopPropagation();
                  setSearchQuery('');
                  searchInputRef.current && searchInputRef.current.focus();
                }}
                className={`ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-all duration-300 ease-in-out ${isSearchExpanded && searchQuery ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Add equipment button */}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-300 ease-in-out flex items-center group h-10"
            onClick={() => setIsAddEquipmentDialogOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2 transition-transform duration-300 ease-in-out group-hover:rotate-90" />
            Add Equipment
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
        <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
          <DialogContent 
            className="max-w-3xl max-h-[65vh] overflow-y-auto p-0"
            aria-describedby="equipment-details-description"
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
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  {selectedEquipment.image_url ? (
                    <img 
                      src={selectedEquipment.image_url || '/images/fallback-equipment.png'} 
                      alt={selectedEquipment.equipment_name}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        console.log('Modal image failed to load:', e.target.src);
                        e.target.onerror = null; // Prevent infinite error loops
                        e.target.src = '/images/fallback-equipment.png';
                      }}
                      crossOrigin="anonymous" // Add CORS support for Supabase storage
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                      <SquareStack className="h-20 w-20 text-gray-300" />
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
                  <Button 
                    variant="ghost"
                    className="h-10 px-4 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setSelectedEquipment(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleOpenEditDialog(selectedEquipment)}
                      className="h-10 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <EditIcon className="h-4 w-4 text-blue-600" />
                      Edit
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
              <p className="text-gray-700">
                Are you sure you want to delete <span className="font-semibold">{equipmentToDelete.equipment_name}</span>?
              </p>
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
    </div>
  );
}