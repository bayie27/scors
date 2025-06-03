import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { PlusCircle, X, UploadCloud, Image as ImageIcon, Loader2, Pencil } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto" aria-describedby="edit-equipment-description">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">Edit Equipment</DialogTitle>
          <DialogDescription id="edit-equipment-description" className="text-muted-foreground mt-1">
            Update the equipment details and click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form id="edit-equipment-form" onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equipment-name" className="text-right font-medium">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="equipment-name"
              name="equipment-name"
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
              className="col-span-3 h-10"
              placeholder="Enter equipment name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="asset-status" className="text-right font-medium">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={assetStatusId}
              onValueChange={setAssetStatusId}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger className="col-span-3 h-10" id="asset-status-trigger">
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

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="equipment-description" className="text-right col-span-1 pt-2 font-medium">
              Description
            </Label>
            <Textarea
              id="equipment-description"
              name="equipment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 min-h-[100px] resize-none"
              placeholder="Enter a brief description of the equipment..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="equipment-image-upload" className="text-right col-span-1 pt-2 font-medium">
              Image
            </Label>
            <div className="col-span-3">
              <Input
                id="equipment-image-upload"
                name="equipment-image-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" // Hidden, triggered by styled label/button
                accept="image/png, image/jpeg, image/gif, image/webp"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 border-dashed hover:border-primary hover:text-primary h-10 transition-all duration-200"
                aria-label="Upload equipment image"
                id="upload-image-button"
              >
                <UploadCloud className="h-4 w-4" />
                {imagePreview ? 'Change image' : 'Upload an image'}
              </Button>
              {imagePreview && (
                <div className="mt-3 relative w-full h-48 border rounded-md overflow-hidden group">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90 shadow-md z-10 hover:opacity-100 transition-all duration-200"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous" // Add CORS support for Supabase storage
                    onError={(e) => {
                      console.error('Failed to load image preview:', e);
                      e.target.onerror = null;
                      e.target.src = '/images/fallback-equipment.png';
                    }}
                  />
                </div>
              )}
              {!imagePreview && (
                <div className="mt-3 flex items-center justify-center w-full h-48 border border-dashed rounded-md bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Allowed types: JPG, PNG, GIF, WEBP.</p>
            </div>
          </div>
        </form>
        <DialogFooter className="border-t pt-4 mt-2">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              disabled={isSubmitting}
              className="h-10 px-4 font-medium"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="edit-equipment-form"
            disabled={isSubmitting || !equipmentName || !assetStatusId}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 gap-2 flex items-center font-medium transition-colors duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
