import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search as SearchIcon, 
  Filter, 
  Users as PeopleIcon, 
  MapPin as MapPinIcon, 
  Projector, 
  AudioLines, 
  Wifi, 
  SquareDashed, 
  SquareStack, 
  Monitor, 
  Clipboard, 
  AirVent, 
  Book,
  X,
  Loader2,
  Upload,
  Image as ImageIcon
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
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { supabase } from '@/supabase-client';
import { venueService } from '@/services/venue-service';
import { toast } from 'react-hot-toast';

// Simple image carousel for venue modal
function VenueImageCarousel({ images = [] }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  const goPrev = (e) => { e.stopPropagation(); setIdx(idx === 0 ? images.length - 1 : idx - 1); };
  const goNext = (e) => { e.stopPropagation(); setIdx(idx === images.length - 1 ? 0 : idx + 1); };
  return (
    <div className="relative w-full h-64 bg-black">
      <img src={images[idx]} alt="Venue" className="w-full h-64 object-cover" />
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

// Map amenity names to Lucide icons
function AmenityIcon({ name, ...props }) {
  switch ((name || '').toLowerCase()) {
    case 'projector': return <Projector {...props} />;
    case 'whiteboard': return <Clipboard {...props} />;
    case 'ac': return <AirVent {...props} />;
    case 'wifi': return <Wifi {...props} />;
    case 'audio': return <AudioLines {...props} />;
    case 'monitor': return <Monitor {...props} />;
    case 'book': return <Book {...props} />;
    default: return <SquareDashed {...props} />;
  }
}

// Map equipment names to Lucide icons
function EquipmentIcon({ name, ...props }) {
  switch ((name || '').toLowerCase()) {
    case 'projector & screen': return <Projector {...props} />;
    case 'audio system': return <AudioLines {...props} />;
    case 'high-speed wifi': return <Wifi {...props} />;
    default: return <SquareStack {...props} />;
  }
}


export function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef(null);
  const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form handling for Add Venue modal
  const [formData, setFormData] = useState({
    venue_name: '',
    capacity: '',
    location: '',
    description: '',
    equipments: '',
    asset_status_id: 1 // Default to available
  });
  
  // Image upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle multiple image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate each file
    let hasError = false;
    const newImages = [];
    const newPreviews = [];
    
    // Process each file
    files.forEach(file => {
      // Validate file type
      if (!file.type.match('image.*')) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Please select only image files (JPEG, PNG, etc.)'
        }));
        hasError = true;
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Each image size should be less than 5MB'
        }));
        hasError = true;
        return;
      }
      
      // Add to new images array
      newImages.push(file);
      
      // Create preview for this file
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          file: file,
          preview: reader.result
        });
        
        // Update state when all previews are ready
        if (newPreviews.length === newImages.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // If no errors, update state
    if (!hasError) {
      setFormErrors(prev => ({
        ...prev,
        image: undefined
      }));
      
      setSelectedImages(prev => [...prev, ...newImages]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove a specific image
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // Clear all selected images
  const clearAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.venue_name?.trim()) errors.venue_name = 'Venue name is required';
    if (!formData.location?.trim()) errors.location = 'Location is required';
    
    // Validate capacity is a positive number if provided
    if (formData.capacity && (isNaN(formData.capacity) || Number(formData.capacity) <= 0)) {
      errors.capacity = 'Capacity must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddVenue = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Parse equipment string to array
      const equipmentArray = formData.equipments
        ? formData.equipments.split(',').map(item => item.trim()).filter(Boolean)
        : [];
      
      // Prepare venue data for insertion
      const venueData = {
        venue_name: formData.venue_name,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        location: formData.location,
        description: formData.description || null,
        equipments: equipmentArray,
        asset_status_id: formData.asset_status_id
      };
      
      // Create temporary image URLs for the optimistic update
      let tempImageUrls = [];
      if (imagePreviews.length > 0) {
        tempImageUrls = imagePreviews.map(img => img.preview);
      }
      
      // Optimistically update UI first
      const tempId = Date.now(); // Temporary ID for optimistic update
      const optimisticVenue = {
        ...venueData,
        venue_id: tempId,
        image_url: tempImageUrls.length > 0 ? tempImageUrls[0] : null, // First image as primary
        images: tempImageUrls, // All images
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Update state immediately
      setVenues(prev => [optimisticVenue, ...prev]);
      
      // Reset form and close modal immediately for better UX
      setFormData({
        venue_name: '',
        capacity: '',
        location: '',
        description: '',
        equipments: '',
        asset_status_id: 1
      });
      clearAllImages();
      setIsAddVenueModalOpen(false);
      
      // Show immediate feedback
      const toastId = toast.loading('Adding venue...');
      
      // Use venueService to create the venue (mirroring user management pattern)
      let finalVenue = await venueService.createVenue(venueData);
      
      // If there are images, upload them to storage
      if (selectedImages.length > 0 && finalVenue) {
        const venueId = finalVenue.venue_id;
        const uploadedImageUrls = [];
        
        // Upload each image
        for (let i = 0; i < selectedImages.length; i++) {
          const image = selectedImages[i];
          const fileExt = image.name.split('.').pop();
          const filePath = `venue_images/${venueId}/${Date.now()}_${i}.${fileExt}`;
          
          // Upload the image to Supabase Storage
          const { error: storageError } = await supabase.storage
            .from('venue_images')
            .upload(filePath, image);
          
          if (storageError) {
            console.error(`Error uploading image ${i}:`, storageError);
            continue; // Skip this image but continue with others
          }
          
          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('venue_images')
            .getPublicUrl(filePath);
          
          if (urlData) {
            const imageUrl = urlData.publicUrl;
            uploadedImageUrls.push(imageUrl);
            
            // Insert into venue_image table
            await supabase
              .from('venue_image')
              .insert([{
                venue_id: venueId,
                storage_path: filePath,
                image_url: imageUrl,
                is_primary: i === 0 // First image is primary
              }]);
          }
        }
        
        // If we have uploaded images, update the venue with the primary image URL
        if (uploadedImageUrls.length > 0) {
          const { data: updatedVenue, error: updateError } = await supabase
            .from('venue')
            .update({ image_url: uploadedImageUrls[0] }) // First image as primary
            .eq('venue_id', venueId)
            .select();
          
          if (updateError) throw updateError;
          
          if (updatedVenue && updatedVenue[0]) {
            // Add all images to the venue object for UI
            finalVenue = {
              ...updatedVenue[0],
              images: uploadedImageUrls
            };
          }
        }
      }
      
      // Update the optimistic entry with the real data
      setVenues(prev => prev.map(v => v.venue_id === tempId ? finalVenue : v));
      toast.success('Venue added successfully!', { id: toastId });
    } catch (error) {
      console.error('Error adding venue:', error);
      toast.error('Failed to add venue. Please try again.');
      // Remove the optimistic entry if there was an error
      setVenues(prev => prev.filter(v => typeof v.venue_id === 'number'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error: supabaseError } = await supabase
        .from('venue')
        .select('*');
      
      if (supabaseError) {
        // Error from Supabase
        throw supabaseError;
      }
      // Transform data to match our expected format
      const formattedVenues = Array.isArray(data) ? data.map(venue => ({
        ...venue,
        // Ensure we have all required fields with defaults if needed
        status: venue?.status || 'available',
        amenities: venue?.amenities || [],
        image_url: venue?.image_url || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
      })) : [];
      setVenues(formattedVenues);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // Display error toast without logging specific error details
      toast.error('Failed to load venues');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupSubscription = useCallback(async () => {
    try {
      // Clean up any existing subscription first
      if (subscriptionRef.current) {
        await subscriptionRef.current.unsubscribe();
      }
      
      // Create new subscription to the venue table
      const channel = supabase.channel('public:venues', {
        config: {
          broadcast: { self: true },
          presence: { key: 'venue-management' },
        },
      });
      
      channel
        .on('presence', { event: 'sync' }, () => {
          
        })
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'venue' }, 
          () => {
            fetchVenues();
          }
        );
      
      // Subscribe to the channel
      await channel.subscribe((status) => {
        console.log(`Venue subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          // Force a refresh when subscription is established
          fetchVenues().catch(error => {
            console.error('Error refreshing after subscription:', error);
            toast.error('Failed to refresh venues after subscription');
          });
        }
      });
      
      // Store the subscription reference
      subscriptionRef.current = channel;
      
    } catch (error) {
      console.error('Error setting up venue subscription:', error);
      toast.error('Failed to set up real-time updates');
      throw error; // Re-throw to be caught by the useEffect
    }
  }, [fetchVenues]);

  // Set up real-time subscription
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await fetchVenues();
        if (isMounted) {
          const cleanup = setupSubscription();
          return cleanup; // Return cleanup function
        }
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Failed to initialize venues');
      }
    };

    const cleanup = init();
    
    // Clean up subscription when component unmounts
    return () => {
      isMounted = false;
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(fn => fn && fn());
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [fetchVenues, setupSubscription]);

  // Filter venues based on search query
  const filteredVenues = venues.filter(venue => 
    (venue.venue_name && venue.venue_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.description && venue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.amenities && Array.isArray(venue.amenities) && venue.amenities.some(a => typeof a === 'string' && a.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Venue Management</h1>
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
          <Button 
            className="ml-4 bg-green-600 hover:bg-green-700 w-full sm:w-auto whitespace-nowrap"
            onClick={() => setIsAddVenueModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Venue
          </Button>
        </div>
      </div>
      
      {/* Add Venue Modal */}
      <Dialog open={isAddVenueModalOpen} onOpenChange={setIsAddVenueModalOpen}>
        <DialogContent className="sm:max-w-[550px] p-0">
          <div className="p-6 border-b">
            <DialogTitle className="text-xl font-semibold">Add New Venue</DialogTitle>
            <DialogDescription className="mt-1">
              Create a new venue by filling out the form below.
            </DialogDescription>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-6 pt-4">
            <form id="add-venue-form" onSubmit={handleAddVenue}>
              <div className="grid gap-4 py-2">
                {/* Venue Name */}
                <div className="grid gap-2">
                  <label htmlFor="venue_name" className="text-sm font-medium">
                    Venue Name <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    id="venue_name" 
                    name="venue_name" 
                    placeholder="e.g., Meeting Room 3" 
                    className={formErrors.venue_name ? "border-red-500" : ""}
                    onChange={handleFormChange}
                  />
                  {formErrors.venue_name && (
                    <p className="text-xs text-red-500">{formErrors.venue_name}</p>
                  )}
                </div>

                {/* Capacity */}
                <div className="grid gap-2">
                  <label htmlFor="capacity" className="text-sm font-medium">
                    Capacity
                  </label>
                  <Input 
                    id="capacity" 
                    name="capacity" 
                    type="number" 
                    min="1"
                    placeholder="e.g., 20" 
                    className={formErrors.capacity ? "border-red-500" : ""}
                    onChange={handleFormChange}
                  />
                  {formErrors.capacity && (
                    <p className="text-xs text-red-500">{formErrors.capacity}</p>
                  )}
                </div>
                
                {/* Location */}
                <div className="grid gap-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    id="location" 
                    name="location" 
                    placeholder="e.g., Ground Floor, Building A" 
                    className={formErrors.location ? "border-red-500" : ""}
                    onChange={handleFormChange}
                  />
                  {formErrors.location && (
                    <p className="text-xs text-red-500">{formErrors.location}</p>
                  )}
                </div>

                {/* Description */}
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    placeholder="Describe the venue and its features"
                    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${formErrors.description ? "border-red-500" : ""}`}
                    onChange={handleFormChange}
                  />
                  {formErrors.description && (
                    <p className="text-xs text-red-500">{formErrors.description}</p>
                  )}
                </div>

                {/* Equipment */}
                <div className="grid gap-2">
                  <label htmlFor="equipments" className="text-sm font-medium">
                    Equipment (comma separated)
                  </label>
                  <Input 
                    id="equipments" 
                    name="equipments" 
                    placeholder="e.g., Projector, Whiteboard, AC" 
                    className={formErrors.equipments ? "border-red-500" : ""}
                    onChange={handleFormChange}
                  />
                  {formErrors.equipments && (
                    <p className="text-xs text-red-500">{formErrors.equipments}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Separate multiple equipment with commas</p>
                </div>

                {/* Multiple Image Upload */}
                <div className="grid gap-2">
                  <label htmlFor="image_upload" className="text-sm font-medium">
                    Venue Images
                  </label>
                  
                  {/* Image Previews Grid */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                      {imagePreviews.map((img, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
                          <img 
                            src={img.preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center py-4">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="mb-1 text-sm text-gray-500">Click to upload images</p>
                      <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB each</p>
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    id="image_upload"
                    name="image_upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  
                  {imagePreviews.length > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">{imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected</p>
                      <button 
                        type="button" 
                        onClick={clearAllImages}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                  
                  {formErrors.image && (
                    <p className="text-xs text-red-500">{formErrors.image}</p>
                  )}
                </div>
              </div>
            </form>
          </div>
          
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsAddVenueModalOpen(false)}
                className="h-10"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="add-venue-form"
                className="h-10 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Venue"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Venues Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredVenues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <Card key={venue.venue_id} className="overflow-hidden h-full flex flex-col hover:shadow-md relative">
              {/* Venue Image - Clickable */}
              <div className="relative h-48 overflow-hidden group cursor-pointer" onClick={() => setSelectedVenue(venue)}>
                <img 
                  src={venue.image_url} 
                  alt={venue.venue_name} 
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 right-2 flex space-x-1 z-0">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="bg-white/90 backdrop-blur-sm h-8 w-8 p-0 shadow-sm hover:bg-gray-100 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add edit functionality here
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="bg-white/90 backdrop-blur-sm h-8 w-8 p-0 shadow-sm hover:bg-red-50 group transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add delete functionality here
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-500 group-hover:text-red-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </Button>
                </div>
              </div>
              
              <CardHeader className="pb-0 pt-4 px-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold">
                    {venue.venue_name}
                  </CardTitle>
                  <Badge className={venue.asset_status_id === 1 ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'} variant="secondary">
                    {venue.asset_status_id === 1 ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 pt-1 px-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{venue.capacity || 12}</span>
                  <span className="mx-2">•</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{venue.location || 'Ground Floor, Building A'}</span>
                </div>
                
                <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                  {venue.description || 'Perfect for small team meetings and presentations with modern amenities'}
                </p>
                
                {/* Equipment Section - Moved to bottom of card */}
                {(venue.equipments && venue.equipments.length > 0) && (
                  <div className="mt-4 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {venue.equipments.map((item, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-gray-100 text-black font-semibold text-xs px-3 py-1"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No venues found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search or filter criteria' : 'Get started by creating a new venue'}
          </p>
          <div className="mt-6">
            <Button
              onClick={() => alert('Add Venue functionality will be implemented soon')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          </div>
        </div>
      )}

      {/* Venue Modal */}
      {selectedVenue && (
        <Dialog open={!!selectedVenue} onOpenChange={(open) => !open && setSelectedVenue(null)}>
          <DialogContent className="max-w-2xl w-full p-0 overflow-hidden bg-white rounded-lg shadow-xl">
            {/* Header */}
            <div className="px-6 pt-6 pb-2 border-b">
              <DialogTitle className="text-2xl font-bold text-gray-900">{selectedVenue.venue_name}</DialogTitle>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className={`text-xs ${selectedVenue.asset_status_id === 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                  {selectedVenue.asset_status_id === 1 ? 'Available' : 'Not Available'}
                </Badge>
                <div className="ml-3 text-sm text-gray-500 flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {selectedVenue.location || 'Ground Floor, Building A'}
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[65vh]">
              {/* Image Carousel */}
              <div className="px-5 py-3">
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <VenueImageCarousel images={
                    Array.isArray(selectedVenue.images)
                      ? selectedVenue.images
                      : typeof selectedVenue.images === 'string' && selectedVenue.images.includes(',')
                        ? selectedVenue.images.split(',').map(img => img.trim())
                        : selectedVenue.images
                          ? [selectedVenue.images]
                          : [selectedVenue.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80']
                  } />
                </div>
              </div>
      
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column: Description */}
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedVenue.description || 'No description available for this venue.'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right column: Equipment */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Equipment Available</h3>
                    <div className="space-y-2">
                      {(selectedVenue.equipments || []).length > 0 ? (
                        selectedVenue.equipments.map((item, idx) => (
                          <div key={idx} className="flex items-center">
                            <EquipmentIcon name={item} className="h-4 w-4 text-indigo-500 mr-2" />
                            <span className="text-sm text-gray-700">{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No equipment listed</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                Last updated: {new Date(selectedVenue.updated_at || new Date()).toLocaleDateString()}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex justify-between sm:justify-end gap-3 w-full">
                  <Button 
                    variant="ghost"
                    className="h-10 px-4 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setSelectedVenue(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 flex items-center gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        // Handle edit
                        toast.success('Edit functionality will be implemented soon!');
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor" className="text-blue-600">
                        <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                      Edit Venue
                    </Button>
                    <div className="border-l border-gray-200 h-6 self-center hidden sm:block"></div>
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete "${selectedVenue.venue_name}"? This action cannot be undone.`)) {
                          try {
                            // Handle delete
                            toast.success('Delete functionality will be implemented soon!');
                            setSelectedVenue(null);
                          } catch (error) {
                            toast.error('Failed to delete venue');
                            console.error('Error deleting venue:', error);
                          }
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="whitespace-nowrap">Delete Venue</span>
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
