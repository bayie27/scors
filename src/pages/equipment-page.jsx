import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search as SearchIcon, 
  Filter, 
  MapPin as MapPinIcon, 
  SquareStack, 
  Tag,
  PackageCheck,
  PackageOpen,
  Clipboard,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { AssetCard } from '@/components/cards/asset-card';

import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { equipmentService } from '@/services/equipment-service';

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
  const subscriptionRef = useRef(null);

  const fetchEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get equipment list from service
      const data = await equipmentService.getEquipment();
      
      // Process images if they are in URL format (comma-separated)
      const processedEquipment = data.map(item => {
        let images = [];
        if (item.image_url) {
          // If image_url is a comma-separated list, split it
          if (item.image_url.includes(',')) {
            images = item.image_url.split(',').map(url => url.trim());
          } else {
            images = [item.image_url];
          }
        }
        return { ...item, images };
      });
      
      setEquipment(processedEquipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Handle search icon click
  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

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

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your equipment inventory</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className={`relative flex items-center transition-all duration-300 ${
            isSearchExpanded ? 'flex-1 md:w-80' : 'w-10'
          }`}>
            {isSearchExpanded ? (
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search equipment..."
                className="pl-10 pr-4 py-2 h-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) {
                    setIsSearchExpanded(false);
                  }
                }}
              />
            ) : (
              <button
                onClick={handleSearchIconClick}
                className="h-10 w-10 flex items-center justify-center rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"
              >
                <SearchIcon className="h-4 w-4" />
              </button>
            )}
            
            {isSearchExpanded && (
              <SearchIcon className="absolute left-3 h-4 w-4 text-gray-400" />
            )}
            
            {isSearchExpanded && searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Filter button */}
          <Button
            variant="outline"
            className="h-10 px-4 flex items-center gap-2 text-gray-700"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden md:inline">Filter</span>
          </Button>
          
          {/* Add equipment button */}
          <Button
            variant="default"
            className="h-10 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              toast.success('Add equipment functionality will be implemented soon!');
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Add Equipment</span>
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
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              toast.success('Add equipment functionality will be implemented soon!');
            }}
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
              image={item.images?.[0]}
              location={item.location}
              description={item.equipment_desc}
              onView={() => setSelectedEquipment(item)}
              onEdit={() => {
                toast.success('Edit functionality will be implemented soon!');
              }}
              onDelete={() => {
                if (window.confirm(`Are you sure you want to delete "${item.equipment_name}"?`)) {
                  toast.success('Delete functionality will be implemented soon!');
                }
              }}
              className="h-full"
            />
          ))}
        </div>
      )}
      
      {/* Equipment detail modal */}
      {selectedEquipment && (
        <Dialog open={!!selectedEquipment} onOpenChange={(open) => !open && setSelectedEquipment(null)}>
          <DialogContent className="max-w-2xl w-full p-0 overflow-hidden bg-white rounded-lg shadow-xl">
            {/* Header */}
            <div className="px-6 pt-6 pb-2 border-b">
              <DialogTitle className="text-2xl font-bold text-gray-900">{selectedEquipment.equipment_name}</DialogTitle>
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
                  {selectedEquipment.images && selectedEquipment.images.length > 0 ? (
                    <img 
                      src={selectedEquipment.images[0]} 
                      alt={selectedEquipment.equipment_name}
                      className="w-full h-64 object-cover"
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
                      variant="outline" 
                      className="h-10 px-4 flex items-center gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        toast.success('Edit functionality will be implemented soon!');
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor" className="text-blue-600">
                        <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                      Edit Equipment
                    </Button>
                    <div className="border-l border-gray-200 h-6 self-center hidden sm:block"></div>
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete "${selectedEquipment.equipment_name}"? This action cannot be undone.`)) {
                          try {
                            toast.success('Delete functionality will be implemented soon!');
                            setSelectedEquipment(null);
                          } catch (error) {
                            toast.error('Failed to delete equipment');
                            console.error('Error deleting equipment:', error);
                          }
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="whitespace-nowrap">Delete Equipment</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}