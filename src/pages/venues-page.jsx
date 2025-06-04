import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search as SearchIcon, 
  Users,
  X,
  Upload,
  Image,
  Trash2,
  Camera,
  SquareStack,
  Projector,
  AudioLines,
  Wifi,
  UploadCloud,
  MapPin
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
    <div className="relative w-full h-48 sm:h-64 bg-black">
      <img src={images[idx]} alt="Venue" className="w-full h-full object-cover" />
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
const venueFormSchema = z.object({
  venue_name: z.string().min(3, { message: "Venue name must be at least 3 characters." }),
  asset_status_id: z.coerce.number({invalid_type_error: 'Please select a status.'}).positive({ message: "Please select a status." }),
  venue_desc: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().nullable(),
  venue_loc: z.string().max(100, { message: "Location must be 100 characters or less." }).optional().nullable(),
  venue_cap: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Capacity must be a number." })
      .positive({ message: "Capacity must be a positive number if provided." })
      .int({ message: "Capacity must be a whole number if provided." })
      .optional()
      .nullable()
  ),
  venue_feat: z.array(z.string()).optional(),
});  // image_url and imageFile are handled separately, not part of RHF schema for direct form data

function AddVenueForm({ onSuccess, onCancel, assetStatuses, isLoadingAssetStatuses }) {
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Equipment input state
  const [equipmentInput, setEquipmentInput] = useState('');
  
  // Image handling
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      venue_name: '',
      asset_status_id: undefined,
      venue_desc: '',
      venue_loc: '',
      venue_cap: null,
      venue_feat: [],
    }
  });
  
  // Remove selected image
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

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    form.setValue('image', null);
  };
  
  const handleAddEquipment = () => {
    if (!equipmentInput.trim()) return;
    
    const currentEquipments = form.getValues('venue_feat') || [];
    if (!currentEquipments.includes(equipmentInput.trim())) {
      form.setValue('venue_feat', [...currentEquipments, equipmentInput.trim()]);
    }
    setEquipmentInput('');
  };

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex items-start px-8 pt-6 pb-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-2xl font-semibold">Add New Venue</h2>
            <p className="text-sm text-gray-500 mt-1.5">Fill in the details below to add a new venue to the inventory.</p>
          </div>
        </div>
        
        <div className="flex-grow px-8 py-6 space-y-6 overflow-y-auto">
          {/* Venue Name */}
          <div className="grid gap-2">
            <FormLabel htmlFor="venue_name">Name <span className="text-red-500">*</span></FormLabel>
            <FormField
              control={form.control}
              name="venue_name"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <Input 
                      id="venue_name" 
                      placeholder="e.g., Main Auditorium" 
                      className="h-10"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Asset Status */}
          <div className="grid gap-2">
            <FormLabel htmlFor="asset_status">Status <span className="text-red-500">*</span></FormLabel>
            <FormField
              control={form.control}
              name="asset_status_id"
              render={({ field }) => (
                <FormItem className="m-0">
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value?.toString()}
                    disabled={isLoadingAssetStatuses || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select status" />
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
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <FormLabel htmlFor="location">Location</FormLabel>
            <FormField
              control={form.control}
              name="venue_loc"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <Input 
                      id="location" 
                      placeholder="e.g., Building B, 3rd Floor" 
                      className="h-10"
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Capacity */}
          <div className="grid gap-2">
            <FormLabel htmlFor="capacity">Capacity</FormLabel>
            <FormField
              control={form.control}
              name="venue_cap"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <Input 
                      id="capacity"
                      type="number" 
                      placeholder="e.g., 100"
                      min="1"
                      className="h-10"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Description */}
          <div className="grid gap-2">
            <FormLabel htmlFor="description">Description</FormLabel>
            <FormField
              control={form.control}
              name="venue_desc"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <Textarea
                      id="description"
                      placeholder="Enter a description for the venue..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Equipment & Amenities */}
          <div className="grid gap-2">
            <FormLabel>Equipment</FormLabel>
            <FormField
              control={form.control}
              name="venue_feat"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(field.value || []).map((item, index) => (
                          <Badge key={index} className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            <EquipmentIcon name={item} className="h-3 w-3 mr-1" />
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
                          value={equipmentInput}
                          onChange={e => setEquipmentInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) { 
                              e.preventDefault(); 
                              handleAddEquipment();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddEquipment}
                          disabled={!equipmentInput.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">Press Enter or click Add. Examples: Projector, Whiteboard</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Image Upload */}
          <div className="grid gap-3">
            <div>
              <FormLabel>Image</FormLabel>
              <p className="text-sm text-gray-500 mt-0.5">Upload a clear photo of the venue</p>
            </div>
            <Input
              id="venue-image-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
              accept="image/png, image/jpeg, image/gif, image/webp"
              disabled={isSubmitting}
            />
            
            {imagePreview ? (
              <div className="mt-2">
                <div className="relative w-full h-48 rounded-md overflow-hidden border">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load image preview:', e);
                      e.target.onerror = null;
                      e.target.src = '/images/fallback-venue.png';
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={triggerFileInput}
                  disabled={isSubmitting}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Change Image
                </Button>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={triggerFileInput}
              >
                <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WEBP up to 5MB</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between px-8 py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-500"></div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#06750F] hover:bg-[#05640d] flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Venue</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

// Edit Venue Form component

const editVenueFormSchema = z.object({
  venue_name: z.string().min(3, { message: "Venue name must be at least 3 characters." }),
  asset_status_id: z.coerce.number({invalid_type_error: 'Please select a status.'}).positive({ message: "Please select a status." }),
  venue_desc: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().nullable(),
  venue_loc: z.string().max(100, { message: "Location must be 100 characters or less." }).optional().nullable(),
  venue_cap: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Capacity must be a number." })
      .positive({ message: "Capacity must be a positive number if provided." })
      .int({ message: "Capacity must be a whole number if provided." })
      .optional()
      .nullable()
  ),
  venue_feat: z.array(z.string()).optional(),
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
      venue_desc: venueToEdit?.venue_desc || '',
      venue_loc: venueToEdit?.venue_loc || '',
      venue_cap: venueToEdit?.venue_cap || null,
      venue_feat: venueToEdit?.venue_feat || [],
    }
  });

  useEffect(() => {
    if (venueToEdit) {
      form.reset({
        venue_name: venueToEdit.venue_name || '',
        asset_status_id: venueToEdit.asset_status_id ?? undefined,
        venue_desc: venueToEdit.venue_desc || '',
        venue_loc: venueToEdit.venue_loc || '',
        venue_cap: venueToEdit.venue_cap || null,
        venue_feat: venueToEdit.venue_feat || [],
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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File is too large. Max 5MB allowed.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast.error('Invalid file type. Only JPG, PNG, GIF, WEBP allowed.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
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
      
      // Ensure empty capacity is properly set to null
      const cleanedData = {
        ...data,
        venue_cap: data.venue_cap === '' || data.venue_cap === undefined ? null : data.venue_cap,
        image_url: removeCurrentImage ? null : (selectedImage ? undefined : venueToEdit.image_url)
      };

      await venueService.updateVenue(
        venueToEdit.venue_id,
        cleanedData,
        selectedImage || undefined,
        venueToEdit.image_url
      );
      
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex items-start px-8 pt-6 pb-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-2xl font-semibold">Edit Venue</h2>
            <p className="text-sm text-gray-500 mt-1.5">Update the details for this venue.</p>
          </div>
        </div>
        
        <div className="px-8 py-6 space-y-6 flex-grow overflow-y-auto max-h-[65vh]">
          {/* Venue Name */}
          <div className="grid gap-2">
            <FormLabel htmlFor="venue_name">Name <span className="text-red-500">*</span></FormLabel>
            <FormField
              control={form.control}
              name="venue_name"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <Input 
                      id="venue_name" 
                      placeholder="e.g., Main Auditorium" 
                      className="h-10"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Asset Status */}
          <div className="grid gap-2">
            <FormLabel htmlFor="asset_status">Status <span className="text-red-500">*</span></FormLabel>
            <FormField
              control={form.control}
              name="asset_status_id"
              render={({ field }) => (
                <FormItem className="m-0">
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                    disabled={isLoadingAssetStatuses || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select status" />
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
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <FormLabel htmlFor="location">Location</FormLabel>
            <FormField
              control={form.control}
              name="venue_loc"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <Input 
                      id="location" 
                      placeholder="e.g., Building B, 3rd Floor" 
                      className="h-10"
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Capacity */}
          <div className="grid gap-2">
            <FormLabel htmlFor="capacity">Capacity</FormLabel>
            <FormField
              control={form.control}
              name="venue_cap"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <Input 
                      id="capacity"
                      type="number" 
                      placeholder="e.g., 100"
                      min="1"
                      className="h-10"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          

          
          {/* Description */}
          <div className="grid gap-2">
            <FormLabel htmlFor="description">Description</FormLabel>
            <FormField
              control={form.control}
              name="venue_desc"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <Textarea
                      id="description"
                      placeholder="Enter a description for the venue..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Equipment & Amenities */}
          <div className="grid gap-2">
            <FormLabel>Equipment</FormLabel>
            <FormField
              control={form.control}
              name="venue_feat"
              render={({ field }) => (
                <FormItem className="m-0">
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(field.value || []).map((item, index) => (
                          <Badge key={index} className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            <EquipmentIcon name={item} className="h-3 w-3 mr-1" />
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
                              field.onChange([...(field.value || []), e.target.value]); 
                              e.target.value = ''; 
                            }
                          }} 
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            const inputElement = e.target.closest('div').querySelector('input[placeholder="Add equipment item"]');
                            if (inputElement && inputElement.value) {
                              field.onChange([...(field.value || []), inputElement.value]);
                              inputElement.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">Press Enter or click Add. Examples: Projector, Whiteboard</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Image Upload - Moved to bottom */}
          <div className="grid gap-3">
            <div>
              <FormLabel>Image</FormLabel>
              <p className="text-sm text-gray-500 mt-0.5">Upload a clear photo of the venue</p>
            </div>
            <Input
              id="venue-image-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
              accept="image/png, image/jpeg, image/gif, image/webp"
              disabled={isSubmitting}
            />
            
            {imagePreview ? (
              <div className="mt-2">
                <div className="relative w-full h-48 rounded-md overflow-hidden border">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Failed to load image preview:', e);
                      e.target.onerror = null;
                      e.target.src = '/images/fallback-venue.png';
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={triggerFileInput}
                  disabled={isSubmitting}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Change Image
                </Button>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={triggerFileInput}
              >
                <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WEBP up to 5MB</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between px-8 py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-500"></div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#06750F] hover:bg-[#05640d] flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                    <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assetStatuses, setAssetStatuses] = useState([]);
  const [isLoadingAssetStatuses, setIsLoadingAssetStatuses] = useState(true);
  const subscriptionRef = useRef(null);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [venueToEdit, setVenueToEdit] = useState(null);
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // For desktop expandable search
  const [fullScreenImage, setFullScreenImage] = useState(null); // For full screen image view
  const [isDeleting, setIsDeleting] = useState(false); // Track delete operation status

  const handleEditVenueClick = (venue) => {
    setVenueToEdit(venue);
    setIsEditVenueOpen(true);
  };

  const handleDeleteVenueClick = (venue) => {
    setVenueToDelete(venue);
    setIsDeleteDialogOpen(true);
  };

  const fetchVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error: supabaseError } = await supabase
        .from('venue')
        .select('*')
        .order('venue_name');
        
      if (supabaseError) {
        console.error('Error fetching venues');
        throw supabaseError;
      }
      
      // Transform data to match our expected format - mapping database column names to interface fields
      const formattedVenues = Array.isArray(data) ? data.map(venue => ({
        venue_id: venue.venue_id,
        venue_name: venue.venue_name,
        asset_status_id: venue.asset_status_id,
        venue_desc: venue.venue_desc,
        venue_loc: venue.venue_loc,
        venue_cap: venue.venue_cap,
        venue_feat: venue.venue_feat || [],
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
        // Venue subscription status updated
        if (status === 'SUBSCRIBED') {
          // Force a refresh when subscription is established
          fetchVenues().catch(() => {
            // Error refreshing after subscription
            toast.error('Failed to refresh venues after subscription');
          });
        }
      });
      
      // Store the subscription reference
      subscriptionRef.current = channel;
      
    } catch (error) {
      // Error setting up venue subscription
      toast.error('Failed to set up real-time updates');
      throw error; // Re-throw to be caught by the useEffect
    }
  }, [fetchVenues]);

  // Set up real-time subscription and initial data fetch
  useEffect(() => {
    let isMounted = true;
    let G_cleanupFromSubscription = null; // Variable to hold the cleanup function from setupSubscription

    const initializeAndSubscribe = async () => {
      try {
        // Initial fetch of venues when component mounts
        await fetchVenues(); 
        
        if (isMounted) {
          // Setup the subscription and get the cleanup function
          const cleanup = await setupSubscription(); 
          if (isMounted) { // Check isMounted again after await, in case component unmounted during setupSubscription
              G_cleanupFromSubscription = cleanup;
          } else {
              // If component unmounted while setupSubscription was running, call its cleanup immediately
              if (typeof cleanup === 'function') {
                  cleanup();
              }
          }
        }
      } catch (error) {
        // Error during initialization or subscription setup
        console.error('Error initializing venues page:', error);
        if (isMounted) { // Only show toast if component is still mounted
          toast.error('Failed to initialize venues page.');
        }
      }
    };

    initializeAndSubscribe();

    // Cleanup function for the useEffect
    return () => {
      isMounted = false; // Signal that the component is unmounting
      // If a cleanup function was obtained from setupSubscription, execute it
      if (G_cleanupFromSubscription && typeof G_cleanupFromSubscription === 'function') {
        G_cleanupFromSubscription();
      }
    };
  }, [fetchVenues, setupSubscription]); // Dependencies for the useEffect

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
    (venue.venue_desc && venue.venue_desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.venue_feat && Array.isArray(venue.venue_feat) && venue.venue_feat.some(a => typeof a === 'string' && a.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Handle venue form success
  const handleVenueFormSuccess = () => {
    setIsAddVenueOpen(false);
    // Reload venue list
    fetchVenues();
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Venue Management</h1>
          <p className="text-sm text-gray-500 mt-1">View details and management options for venues</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 sm:gap-y-0 sm:space-x-3 w-full sm:w-auto">
            {/* Mobile Search (visible on base, hidden on sm and up) */}
            <div className="relative flex items-center w-full sm:hidden">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search venues..."
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
                  aria-label="Search venues"
                >
                  <SearchIcon className="h-6 w-6" />
                </Button>
              )}
            </div>
            
            {/* Add Venue Button: full width on mobile, auto width on sm+ */}
            <Dialog open={isAddVenueOpen} onOpenChange={setIsAddVenueOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#07A012] hover:bg-[#058a0e] text-white h-10 w-full sm:w-auto flex items-center justify-center px-4 text-sm sm:text-base group transition-colors">
                  <Plus className="h-4 w-4 mr-1.5 transition-transform duration-300 ease-in-out group-hover:rotate-90" />
                  <span>Add Venue</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[400px] p-0 max-h-[90vh] overflow-hidden mx-auto">
                <div className="flex flex-col h-full max-h-[90vh]">
                  <AddVenueForm 
                    onSuccess={handleVenueFormSuccess} 
                    onCancel={() => setIsAddVenueOpen(false)} 
                    assetStatuses={assetStatuses} 
                    isLoadingAssetStatuses={isLoadingAssetStatuses} 
                  />
                </div>
              </DialogContent>
            </Dialog>
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
              <div 
                className="relative h-48 overflow-hidden group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (venue.image_url) {
                    setFullScreenImage(venue.image_url);
                  } else {
                    setSelectedVenue(venue);
                  }
                }}
              >
                {venue.image_url ? (
                  <>
                    <img 
                      src={venue.image_url} 
                      alt={venue.venue_name} 
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-1 z-10">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-gray-700 bg-gray-100 hover:text-blue-600 hover:bg-blue-100 active:bg-blue-200 rounded-md shadow-md transition-colors duration-150 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVenueToEdit(venue);
                      setIsEditVenueOpen(true);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-red-500 bg-gray-100 hover:text-red-600 hover:bg-red-100 active:bg-red-200 rounded-md shadow-md transition-colors duration-150 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVenueToDelete(venue);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <CardHeader className="pb-0 pt-4 px-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base sm:text-lg font-semibold">
                    {venue.venue_name}
                  </CardTitle>
                  <Badge className={`text-xs ${venue.asset_status_id === 1 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`} variant="outline">
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
                  <span>{venue.venue_cap}</span>
                  <span className="mx-2">•</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{venue.venue_loc}</span>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-700 mb-3 line-clamp-2">
                  {venue.venue_desc}
                </p>
                
                {/* Equipment Section - Moved to bottom of card */}
                {(venue.venue_feat && venue.venue_feat.length > 0) && (
                  <div className="mt-2 sm:mt-4 pt-0">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {venue.venue_feat.map((item, idx) => (
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
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[90vw] sm:max-w-[360px] p-6 mx-auto">
          <DialogHeader className="space-y-2 text-center pb-2">
            <DialogTitle className="text-xl font-semibold">Delete Venue</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete the venue "{venueToDelete?.venue_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-stretch gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="w-full"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!venueToDelete) return;
                
                setIsDeleting(true);
                try {
                  const result = await venueService.deleteVenue(venueToDelete.venue_id);
                  if (result.reservationsCancelled > 0) {
                    toast.success(
                      <div className="space-y-1">
                        <p className="font-medium">Venue "{venueToDelete.venue_name}" has been deleted</p>
                        <p className="text-sm">
                          {result.reservationsCancelled} associated {result.reservationsCancelled === 1 ? 'reservation' : 'reservations'} {result.reservationsCancelled === 1 ? 'was' : 'were'} automatically cancelled
                        </p>
                      </div>,
                      { duration: 5000 }
                    );
                  } else {
                    toast.success(`Venue "${venueToDelete.venue_name}" has been deleted`);
                  }
                  fetchVenues(); // Refresh the venue list immediately
                  setIsDeleteDialogOpen(false);
                  setVenueToDelete(null);
                } catch (error) {
                  console.error('Error deleting venue:', error);
                  // Generic error message for other errors
                  toast.error('Failed to delete venue: ' + (error.message || 'Unknown error'));
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
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
            <div className="flex flex-col h-full max-h-[90vh]">
              <EditVenueForm 
                key={venueToEdit.venue_id} // Force re-mount on venue change
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
        <Dialog open={!!selectedVenue} onOpenChange={(newOpenState) => {
          if (!newOpenState) setSelectedVenue(null);
        }}>
          <DialogContent 
            className="w-full max-w-lg md:max-w-xl lg:max-w-2xl max-h-[65vh] overflow-y-auto p-0"
            aria-describedby="venue-details-description"
          >
            {/* Header */}
            <div className="border-b pb-4 px-6 pt-6">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {selectedVenue.venue_name}
              </DialogTitle>
              <DialogDescription id="venue-details-description" className="mt-1 text-sm text-gray-500">
                View details and management options for this venue
              </DialogDescription>
              <div className="mt-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${selectedVenue.asset_status_id === 1 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                >
                  {selectedVenue.asset_status_id === 1 ? 'Available' : 'Not Available'}
                </Badge>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[65vh]">
              {/* Image */}
              <div className="px-5 py-3">
                <div 
                  className="overflow-hidden rounded-lg border border-gray-200 cursor-pointer relative group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedVenue.image_url) {
                      setFullScreenImage(selectedVenue.image_url);
                    }
                  }}
                >
                  {selectedVenue.image_url ? (
                    <>
                      <img 
                        src={selectedVenue.image_url} 
                        alt={selectedVenue.venue_name}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-40">
                        <span className="text-white bg-black bg-opacity-50 rounded-full p-2">
                          <Image className="h-6 w-6" />
                          <span className="sr-only">View Full Size</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400" />
                      <span className="sr-only">No image available</span>
                    </div>
                  )}
                </div>
              </div>
      
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 gap-6">
                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column - Description */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold text-gray-900">Description</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {selectedVenue.venue_desc || 'No description available for this venue.'}
                        </p>
                      </div>
                    </div>

                    {/* Right Column - Details and Equipment */}
                    <div className="space-y-6">
                      {/* Details */}
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold text-gray-900">Details</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600">
                              {selectedVenue.venue_loc || 'No location specified'}
                            </span>
                          </div>
                          {selectedVenue.venue_cap && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm text-gray-600">
                                Capacity: {selectedVenue.venue_cap}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Equipment & Amenities */}
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold text-gray-900">Equipment & Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {(selectedVenue.venue_feat || []).length > 0 ? (
                            selectedVenue.venue_feat.map((item, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs gap-1.5 border-gray-200">
                                <EquipmentIcon name={item} className="h-3 w-3" />
                                {item}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No equipment or amenities listed</p>
                          )}
                        </div>
                      </div>
                    </div> {/* End of right column */}
                  </div> {/* End of grid */}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-6 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500 mb-2 sm:mb-0"></div>
              <div className="flex flex-col w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-3 w-full">

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 flex items-center justify-center sm:justify-start gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
                      onClick={() => { handleEditVenueClick(selectedVenue); setSelectedVenue(null); }}
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
                      onClick={() => { handleDeleteVenueClick(selectedVenue); setSelectedVenue(null); }}
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
      
      {/* Full Screen Image Dialog */}
      <Dialog open={!!fullScreenImage} onOpenChange={(open) => !open && setFullScreenImage(null)}>
        <DialogContent 
          className="p-0 border-0 shadow-none bg-white max-w-none w-full h-full max-h-none"
          hideCloseButton
        >
          <div 
            className="fixed inset-0 flex flex-col items-center justify-center bg-white cursor-pointer"
            onClick={() => setFullScreenImage(null)}
          >
            {fullScreenImage && (
              <div className="relative">
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullScreenImage(null);
                    }}
                    className="absolute -right-2 -top-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 z-10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <img 
                    src={fullScreenImage} 
                    alt="Full screen view" 
                    className="max-h-[85vh] max-w-[90vw] object-contain"
                  />
                </div>
                <div className="text-center mt-4 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
                  Click anywhere to close
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
