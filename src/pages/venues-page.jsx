import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search as SearchIcon, 
  Users as PeopleIcon, 
  X,
  Upload,
  Image,
  Trash2,
  Camera,
  SquareStack,
  Projector,
  AudioLines,
  Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader
} from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Loader2 } from 'lucide-react';

// Placeholder function to fetch asset statuses
// TODO: Replace with actual Supabase query to your 'asset_status' table
async function getAssetStatuses() {
    console.log('Fetching asset statuses...');
  const { data, error } = await supabase
    .from('asset_status')
    .select('asset_status_id, asset_status_name');

  if (error) {
    console.error('Error fetching asset statuses:', error);
    toast.error('Failed to load asset statuses. Please try refreshing the page.');
    return [];
  }
  
  // console.log('Fetched asset statuses:', data);
  return data || [];
}

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

// Map equipment names to Lucide icons
function EquipmentIcon({ name, ...props }) {
  switch ((name || '').toLowerCase()) {
    case 'projector & screen': return <Projector {...props} />;
    case 'audio system': return <AudioLines {...props} />;
    case 'high-speed wifi': return <Wifi {...props} />;
    default: return <SquareStack {...props} />;
  }
}
// Add Venue Form component
const addVenueFormSchema = z.object({
  venue_name: z.string().min(3, { message: "Venue name must be at least 3 characters." }),
  asset_status_id: z.coerce.number({invalid_type_error: 'Please select a status.'}).positive({ message: "Please select a status." }),
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().nullable(),
  location: z.string().max(100, { message: "Location must be 100 characters or less." }).optional().nullable(),
  capacity: z.coerce.number().positive({ message: "Capacity must be a positive number." }).int().optional().nullable(),
  equipments: z.array(z.string()).optional(),
  // image_url and imageFile are handled separately, not part of RHF schema for direct form data
});

function AddVenueForm({ onSuccess, onCancel, assetStatuses, isLoadingAssetStatuses }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(addVenueFormSchema), // Use the external schema
    defaultValues: {
      venue_name: '',
      asset_status_id: undefined, // Matches addVenueFormSchema
      description: '',
      location: '',
      capacity: null, // Matches addVenueFormSchema (number | null)
      equipments: [], // Matches addVenueFormSchema
    },
  });

  // The rest of the defaultValues from the original internal schema are covered by addVenueFormSchema
  // Original internal default values for reference (now removed):
  // description: '',
  // location: '',
  // capacity: '', // This was problematic, schema expects number or null
  // asset_status_id: 1, // Now undefined to show placeholder
  // equipments: []

  // onSubmit function and other component logic follows...
  
  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Open file dialog
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Create venue with image if selected
      await venueService.createVenue(data, selectedImage);
      
      toast.success('Venue created successfully!');
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating venue:', error);
      toast.error('Failed to create venue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader className="px-4 sm:px-6 pt-6 pb-4">
          <DialogTitle>Add New Venue</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new venue to the system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-6">
          {/* Left column - Form fields */}
          <div className="space-y-4">
            {/* Venue Name */}
            <FormField
              control={form.control}
              name="venue_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter venue name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the venue..."
                      className="resize-none min-h-[100px]"
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Venue location" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Capacity */}
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Maximum capacity"
                      min="1"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Asset Status */}
            <FormField
              control={form.control}
              name="asset_status_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Status*</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))} // RHF expects number based on schema
                    defaultValue={field.value?.toString()} // Select expects string value for defaultValue/value
                    disabled={isLoadingAssetStatuses || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingAssetStatuses ? "Loading statuses..." : "Select a status"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingAssetStatuses && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                      {!isLoadingAssetStatuses && assetStatuses && assetStatuses.length > 0 ? (
                        assetStatuses.map((status) => (
                          <SelectItem key={status.asset_status_id} value={status.asset_status_id.toString()}>
                            {status.asset_status_name}
                          </SelectItem>
                        ))
                      ) : (
                        !isLoadingAssetStatuses && <SelectItem value="no-options" disabled>No statuses available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Equipments */}
            <FormField
              control={form.control}
              name="equipments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment & Amenities</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((item, index) => (
                          <Badge key={index} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1">
                            {item}
                            <button 
                              type="button"
                              className="ml-2 text-blue-700 hover:text-blue-900"
                              onClick={() => {
                                const newValues = [...field.value];
                                newValues.splice(index, 1);
                                field.onChange(newValues);
                              }}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add equipment item"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) {
                              e.preventDefault();
                              field.onChange([...field.value, e.target.value]);
                              e.target.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.target.previousSibling;
                            if (input.value) {
                              field.onChange([...field.value, input.value]);
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Press Enter or click Add to add equipment items. Examples: Projector, Whiteboard, Air Conditioning
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Right column - Image upload */}
          <div className="space-y-4">
            <FormLabel>Venue Image</FormLabel>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center ${imagePreview ? 'border-gray-300' : 'border-gray-200 hover:border-gray-300'} transition-colors`}
            >
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Venue preview" 
                    className="mx-auto max-h-[180px] sm:max-h-[250px] rounded-md object-contain" 
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={handleRemoveImage}
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center py-6 sm:py-10 cursor-pointer"
                  onClick={triggerFileInput}
                >
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <Camera className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="text-sm font-medium mb-1">Click to upload an image</div>
                  <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 px-4 sm:px-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="gap-2 w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Venue'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Edit Venue Form component

const editVenueFormSchema = z.object({
  venue_name: z.string().min(3, { message: "Venue name must be at least 3 characters." }),
  asset_status_id: z.coerce.number({invalid_type_error: 'Please select a status.'}).positive({ message: "Please select a status." }),
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().nullable(),
  location: z.string().max(100, { message: "Location must be 100 characters or less." }).optional().nullable(),
  capacity: z.coerce.number().positive({ message: "Capacity must be a positive number." }).int().optional().nullable(),
  equipments: z.array(z.string()).optional(),
});

function EditVenueForm({ venueToEdit, onSuccess, onCancel, assetStatuses, isLoadingAssetStatuses }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const fileInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(editVenueFormSchema),
    defaultValues: {
      venue_name: venueToEdit?.venue_name || '',
      asset_status_id: venueToEdit?.asset_status_id ?? undefined,
      description: venueToEdit?.description || '',
      location: venueToEdit?.location || '',
      capacity: venueToEdit?.capacity || null,
      equipments: venueToEdit?.equipments || [],
    }
  });

  useEffect(() => {
    if (venueToEdit) {
      form.reset({
        venue_name: venueToEdit.venue_name || '',
        asset_status_id: venueToEdit.asset_status_id ?? undefined,
        description: venueToEdit.description || '',
        location: venueToEdit.location || '',
        capacity: venueToEdit.capacity || null,
        equipments: venueToEdit.equipments || [],
      });
      if (venueToEdit.image_url) {
        setImagePreview(venueToEdit.image_url);
        setSelectedImage(null); 
        setRemoveCurrentImage(false);
      } else {
        setImagePreview(null);
      }
    }
  }, [venueToEdit, form]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setRemoveCurrentImage(false); 
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveCurrentImage(true); 
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const updateData = {
        ...data,
        venue_id: venueToEdit.venue_id,
        image_url: removeCurrentImage ? null : (selectedImage ? undefined : venueToEdit.image_url)
      };

      await venueService.updateVenue(updateData, selectedImage || undefined);
      
      toast.success('Venue updated successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating venue:', error);
      toast.error('Failed to update venue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader className="px-4 sm:px-6 pt-6 pb-4">
          <DialogTitle>Edit Venue: {venueToEdit?.venue_name}</DialogTitle>
          <DialogDescription>
            Update the details for this venue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-6">
          {/* Left column - Form fields */}
          <div className="space-y-4">
            <FormField control={form.control} name="venue_name" render={({ field }) => (
              <FormItem><FormLabel>Venue Name*</FormLabel><FormControl><Input placeholder="Enter venue name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the venue..." className="resize-none min-h-[100px]" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Venue location" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="capacity" render={({ field }) => (
              <FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" placeholder="Maximum capacity" min="1" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField
              control={form.control}
              name="asset_status_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Status*</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))} // RHF expects number
                    value={field.value?.toString()} // Ensure the component is fully controlled
                    disabled={isLoadingAssetStatuses || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingAssetStatuses ? "Loading statuses..." : "Select a status"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingAssetStatuses && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                      {!isLoadingAssetStatuses && assetStatuses && assetStatuses.length > 0 ? (
                        assetStatuses.map((status) => (
                          <SelectItem key={status.asset_status_id} value={status.asset_status_id.toString()}>
                            {status.asset_status_name}
                          </SelectItem>
                        ))
                      ) : (
                        !isLoadingAssetStatuses && <SelectItem value="no-options" disabled>No statuses available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="equipments" render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment & Amenities</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(field.value || []).map((item, index) => (
                          <Badge key={index} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1">
                            {item}
                            <button type="button" className="ml-2 text-blue-700 hover:text-blue-900" onClick={() => {
                                const newValues = [...field.value];
                                newValues.splice(index, 1);
                                field.onChange(newValues);
                              }}>
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Add equipment item" className="flex-1" onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) { e.preventDefault(); field.onChange([...(field.value || []), e.target.value]); e.target.value = ''; }
                          }} />
                        <Button type="button" variant="outline" size="sm" onClick={(e) => {
                            const input = e.target.closest('.flex').querySelector('input');
                            if (input && input.value) { field.onChange([...(field.value || []), input.value]); input.value = ''; }
                          }}>Add</Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>Press Enter or click Add. Examples: Projector, Whiteboard</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
          </div>

          {/* Right column - Image upload */}
          <div className="space-y-4">
            <FormItem>
              <FormLabel>Venue Image</FormLabel>
              <FormControl>
                <div className="w-full h-40 sm:h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 relative overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Venue preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Image className="mx-auto h-10 sm:h-12 w-10 sm:w-12" />
                      <p className="mt-2 text-xs sm:text-sm">Click to upload or drag & drop</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </FormControl>
              {imagePreview && (
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={triggerFileInput} className="w-full sm:w-auto">
                    <Upload className="mr-2 h-4 w-4" /> Change Image
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Remove Image
                  </Button>
                </div>
              )}
              {!imagePreview && (
                 <Button type="button" variant="outline" size="sm" onClick={triggerFileInput} className="w-full mt-2">
                    <Upload className="mr-2 h-4 w-4" /> Select Image
                  </Button>
              )}
              <FormMessage />
            </FormItem>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 px-4 sm:px-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="gap-2 w-full sm:w-auto" 
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assetStatuses, setAssetStatuses] = useState([]);
  const [isLoadingAssetStatuses, setIsLoadingAssetStatuses] = useState(true);
  const subscriptionRef = useRef(null);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [venueToEdit, setVenueToEdit] = useState(null);
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);

  const fetchVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error: supabaseError } = await supabase
        .from('venue')
        .select('*')
        .order('venue_name');
        
      if (supabaseError) {
        console.error('Error fetching venues:', supabaseError);
        throw supabaseError;
      }
      
      // Transform data to match our expected format - mapping database column names to interface fields
      const formattedVenues = Array.isArray(data) ? data.map(venue => ({
        venue_id: venue.venue_id,
        venue_name: venue.venue_name,
        asset_status_id: venue.asset_status_id,
        description: venue.venue_desc,
        location: venue.venue_loc,
        capacity: venue.venue_cap,
        equipments: venue.venue_feat || [],
        image_url: venue.image_url
      })) : [];
      
      setVenues(formattedVenues);
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

  useEffect(() => {
    const fetchAssetStatuses = async () => {
      try {
        setIsLoadingAssetStatuses(true);
        const statuses = await getAssetStatuses();
        setAssetStatuses(statuses);
      } catch (error) {
        console.error('Error fetching asset statuses:', error);
        toast.error('Failed to load asset statuses');
      } finally {
        setIsLoadingAssetStatuses(false);
      }
    };
    fetchAssetStatuses();
  }, []);

  // Filter venues based on search query
  const filteredVenues = venues.filter(venue => 
    (venue.venue_name && venue.venue_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.description && venue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.amenities && Array.isArray(venue.amenities) && venue.amenities.some(a => typeof a === 'string' && a.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Handle venue form success
  const handleVenueFormSuccess = () => {
    setIsAddVenueOpen(false);
    // Reload venue list
    fetchVenues();
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Venue Management</h1>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Add Venue Button */}
          <Dialog open={isAddVenueOpen} onOpenChange={setIsAddVenueOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1 mb-3 sm:mb-0 w-full sm:w-auto order-2 sm:order-2">
                <Plus className="h-4 w-4" />
                <span>Add Venue</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg md:max-w-xl p-0 max-h-[90vh] overflow-hidden">
              <div className="max-h-[90vh] overflow-y-auto pb-4">
                <AddVenueForm 
                  onSuccess={handleVenueFormSuccess} 
                  onCancel={() => setIsAddVenueOpen(false)} 
                  assetStatuses={assetStatuses} 
                  isLoadingAssetStatuses={isLoadingAssetStatuses} 
                />
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Search pill - icon only by default, expands to input on click */}
          <div className="h-10 flex items-center order-1 sm:order-1 w-full sm:w-auto">
            <div
              className={`flex items-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden group ${isSearchExpanded ? 'border border-gray-200 shadow-sm bg-white rounded-full w-full sm:w-64 px-4 py-2 justify-start' : 'w-10 h-10 p-0 justify-center border-0 shadow-none bg-none'}`}
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
        </div>
      </div>

      {/* Venues Grid */}
      <div className="mt-6">
        {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredVenues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <Card 
              key={venue.venue_id} 
              className="overflow-hidden h-full flex flex-col hover:shadow-md relative cursor-pointer" 
              onClick={() => setSelectedVenue(venue)}
            >
              {/* Venue Image */}
              <div className="relative h-48 overflow-hidden group">
                {venue.image_url ? (
                  <img 
                    src={venue.image_url} 
                    alt={venue.venue_name} 
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 right-2 flex space-x-1 z-10">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="bg-white/90 backdrop-blur-sm h-8 w-8 p-0 shadow-sm hover:bg-gray-100 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVenueToEdit(venue);
                      setIsEditVenueOpen(true);
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
                      setVenueToDelete(venue);
                      setIsDeleteDialogOpen(true);
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
                  <CardTitle className="text-base sm:text-lg font-semibold">
                    {venue.venue_name}
                  </CardTitle>
                  <Badge className={venue.asset_status_id === 1 ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'} variant="secondary">
                    {venue.asset_status_id === 1 ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 pt-1 px-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{venue.capacity}</span>
                  <span className="mx-2">•</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{venue.location}</span>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-700 mb-3 line-clamp-2">
                  {venue.description}
                </p>
                
                {/* Equipment Section - Moved to bottom of card */}
                {(venue.equipments && venue.equipments.length > 0) && (
                  <div className="mt-2 sm:mt-4 pt-0">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {venue.equipments.map((item, idx) => (
                        <Badge key={idx} className="bg-blue-50 text-blue-700 hover:bg-blue-50" variant="secondary">
                          <EquipmentIcon name={item} className="h-3 w-3 mr-1" />
                          {item}
                        </Badge>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Venue</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the venue "{venueToDelete?.venue_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (!venueToDelete) return;
                
                setIsDeleting(true);
                try {
                  await venueService.deleteVenue(venueToDelete.venue_id);
                  toast.success(`Venue "${venueToDelete.venue_name}" has been deleted`);
                  fetchVenues(); // Refresh the venue list immediately
                  setIsDeleteDialogOpen(false);
                  setVenueToDelete(null);
                } catch (error) {
                  console.error('Error deleting venue:', error);
                  
                  // Handle the PostgreSQL foreign key constraint error (code 23503)
                  if (error.code === '23503' || 
                      (error.message && error.message.toLowerCase().includes('foreign key constraint')) ||
                      (error.details && error.details.toLowerCase().includes('referenced'))) {
                    toast.error(
                      <div className="space-y-2">
                        <p className="font-medium">Cannot delete this venue</p>
                        <p>This venue has existing reservations and cannot be deleted.</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Try setting its status to "Unavailable" instead or remove its reservations first.
                        </p>
                      </div>,
                      { duration: 5000 } // Show for longer
                    );
                  } else {
                    // Generic error message for other errors
                    toast.error('Failed to delete venue: ' + (error.message || 'Unknown error'));
                  }
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Venue Dialog */}
      {venueToEdit && (
        <Dialog open={isEditVenueOpen} onOpenChange={setIsEditVenueOpen}>
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg md:max-w-xl p-0 max-h-[90vh] overflow-hidden">
            <div className="max-h-[90vh] overflow-y-auto pb-4">
              <EditVenueForm 
                venueToEdit={venueToEdit} 
                onSuccess={() => {
                  setIsEditVenueOpen(false);
                  setVenueToEdit(null);
                  fetchVenues(); // Refresh list on success
                }}
                onCancel={() => {
                  setIsEditVenueOpen(false);
                  setVenueToEdit(null);
                }}
                assetStatuses={assetStatuses}
                isLoadingAssetStatuses={isLoadingAssetStatuses}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Venue Modal */}
      {selectedVenue && (
        <Dialog open={true} onOpenChange={() => setSelectedVenue(null)}>
          <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] p-0 overflow-hidden overflow-y-auto">
            {/* Header */}
            <div className="px-4 sm:px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">{selectedVenue.venue_name}</DialogTitle>
              <div className="flex items-center mt-2">
                <Badge variant="outline" className={`text-xs ${selectedVenue.asset_status_id === 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                  {selectedVenue.asset_status_id === 1 ? 'Available' : 'Not Available'}
                </Badge>
              </div>
              {/* Image Carousel */}
              {selectedVenue.image_url ? (
                <div className="mt-4">
                  <VenueImageCarousel images={[selectedVenue.image_url].filter(Boolean)} />
                </div>
              ) : (
                <div className="relative w-full h-48 sm:h-64 bg-gray-100 flex flex-col items-center justify-center mt-4">
                  <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <span className="text-gray-500 mt-2 sm:mt-4">No images available</span>
                </div>
              )}
              
              {/* Content */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold pr-16 sm:pr-0">{selectedVenue.venue_name}</h2>
                    <p className="text-gray-500">
                      {selectedVenue.location || 'No location provided'}
                    </p>
                  </div>
                  <Badge className={`mt-1 sm:mt-0 self-start ${selectedVenue.asset_status_id === 1 ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}`} variant="secondary">
                    {selectedVenue.asset_status_id === 1 ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  {/* Left Column */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p className="text-gray-700 mb-5">
                      {selectedVenue.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center text-sm">
                      <div className="flex items-center">
                        <PeopleIcon className="h-4 w-4 flex-shrink-0 text-gray-500 mr-2" />
                        <span className="text-sm"><strong>Capacity:</strong> {selectedVenue.capacity || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Equipment & Amenities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-6 py-4 border-t bg-gray-50">
              <div className="text-sm text-gray-500 mb-2 sm:mb-0">
                Last updated: {new Date().toLocaleDateString()}
              </div>
              <div className="flex flex-col w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button 
                    variant="ghost"
                    className="h-10 px-4 text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full sm:w-auto mb-3 sm:mb-0"
                    onClick={() => setSelectedVenue(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 flex items-center justify-center sm:justify-start gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
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
                      className="h-10 px-4 flex items-center justify-center sm:justify-start gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300 w-full sm:w-auto mt-3 sm:mt-0"
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
    </div>
  );
}
