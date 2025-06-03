import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label as FormLabel } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { X, UploadCloud, Loader2, Pencil } from 'lucide-react';

// Placeholder for actual asset statuses - ideally fetched or from a constant file
const assetStatuses = [
  { id: 1, name: 'Available' },
  { id: 2, name: 'Not Available' },
];

export function EditEquipmentDialog({ open, onOpenChange, equipment, onSubmitSuccess }) {
  const [equipmentName, setEquipmentName] = useState('');
  const [assetStatusId, setAssetStatusId] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const fileInputRef = useRef(null);

  // Load equipment data when the component mounts or equipment changes
  useEffect(() => {
    if (equipment && open) {
      setEquipmentName(equipment.equipment_name || '');
      setAssetStatusId(equipment.asset_status_id ? String(equipment.asset_status_id) : '');
      setDescription(equipment.equipment_desc || '');
      
      if (equipment.image_url) {
        setImagePreview(equipment.image_url);
        setRemoveCurrentImage(false);
      } else {
        setImagePreview(null);
      }
    }
  }, [equipment, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setEquipmentName('');
      setAssetStatusId('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      setIsSubmitting(false);
      setRemoveCurrentImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
    }
  }, [open]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
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
      
      setImageFile(file);
      setRemoveCurrentImage(false);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveCurrentImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!equipmentName || !assetStatusId) {
      toast.error('Equipment Name and Status are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare update data
      const equipmentData = {
        equipment_id: equipment.equipment_id,
        equipment_name: equipmentName,
        asset_status_id: parseInt(assetStatusId, 10),
        equipment_desc: description || null,
        // If removing current image, set to null
        // If not changing image, don't include in update data
        image_url: removeCurrentImage ? null : undefined
      };
      
      console.log('Updating equipment with data:', equipmentData);
      console.log('Image file:', imageFile ? imageFile.name : 'No image file');
      
      // Call the parent component's submission handler with data and image
      await onSubmitSuccess(equipmentData, imageFile, removeCurrentImage);
      
      toast.success('Equipment updated successfully!');
      
      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update equipment:', error);
      toast.error(error.message || 'Failed to update equipment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no equipment is provided, don't render the dialog
  if (!equipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[520px] p-0 max-h-[90vh] overflow-hidden">
        <div className="flex items-start px-8 pt-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-semibold">Edit Equipment</h2>
            <p className="text-sm text-gray-500 mt-1.5">Update the details for this equipment.</p>
          </div>
        </div>
        
        <div className="px-8 py-6 space-y-6">
          <form id="edit-equipment-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Equipment Name */}
            <div className="grid gap-2">
              <FormLabel htmlFor="equipment-name">Name <span className="text-red-500">*</span></FormLabel>
              <Input
                id="equipment-name"
                name="equipment-name"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="h-10"
                placeholder="Enter equipment name"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Asset Status */}
            <div className="grid gap-2">
              <FormLabel htmlFor="asset-status">Status <span className="text-red-500">*</span></FormLabel>
              <Select
                value={assetStatusId}
                onValueChange={setAssetStatusId}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {assetStatuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <FormLabel htmlFor="equipment-description">Description</FormLabel>
              <Textarea
                id="equipment-description"
                name="equipment-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="Enter a brief description of the equipment..."
                disabled={isSubmitting}
              />
            </div>

            {/* Image Upload */}
            <div className="grid gap-3">
              <div>
                <FormLabel>Image</FormLabel>
                <p className="text-sm text-gray-500 mt-0.5">Upload a clear photo of the equipment</p>
              </div>
              <Input
                id="equipment-image-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
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
                        e.target.src = '/images/fallback-equipment.png';
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Change Image
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WEBP up to 5MB</p>
                </div>
              )}
            </div>
          </form>
        </div>
        
        <DialogFooter className="flex justify-end gap-3 px-8 py-4 border-t bg-gray-50">
          <Button 
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 h-10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-equipment-form"
            disabled={isSubmitting || !equipmentName || !assetStatusId}
            className="w-full sm:w-auto gap-2 px-6 h-10 bg-[#06750F] hover:bg-[#05640d]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
