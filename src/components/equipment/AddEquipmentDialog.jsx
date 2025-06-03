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
import { PlusCircle, X, UploadCloud, Image as ImageIcon } from 'lucide-react';

// Placeholder for actual asset statuses - ideally fetched or from a constant file
const assetStatuses = [
  { id: 1, name: 'Available' },
  { id: 2, name: 'Not Available' },
];

export function AddEquipmentDialog({ open, onOpenChange, onSubmitSuccess }) {
  const [equipmentName, setEquipmentName] = useState('');
  const [assetStatusId, setAssetStatusId] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Reset form when dialog closes or opens
    if (!open) {
      setEquipmentName('');
      setAssetStatusId('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      setIsSubmitting(false);
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
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast.error('Invalid file type. Only JPG, PNG, GIF, WEBP allowed.');
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setImageFile(file);
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
      const equipmentData = {
        equipment_name: equipmentName,
        asset_status_id: parseInt(assetStatusId, 10),
        equipment_desc: description || null,
      };
      
      console.log('Submitting equipment with data:', equipmentData);
      console.log('Image file:', imageFile ? imageFile.name : 'No image file');
      
      // Call the parent component's submission handler with data and image
      await onSubmitSuccess(equipmentData, imageFile);
      
      toast.success('Equipment added successfully!');
      
      // Reset form state - wait a moment before closing to ensure smooth transition
      setTimeout(() => {
        setEquipmentName('');
        setAssetStatusId('');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 100);
      
      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add equipment:', error);
      toast.error(error.message || 'Failed to add equipment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto"
        aria-describedby="add-equipment-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Equipment
          </DialogTitle>
          <DialogDescription id="add-equipment-description">
            Fill in the details below to add a new piece of equipment to the inventory.
          </DialogDescription>
        </DialogHeader>
        <form id="add-equipment-form" onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equipment-name" className="text-right col-span-1">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="equipment-name"
              name="equipment-name"
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
              className="col-span-3"
              placeholder="Enter equipment name..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="asset-status-id" className="text-right col-span-1">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              id="asset-status-id"
              name="asset-status-id"
              value={assetStatusId}
              onValueChange={setAssetStatusId}
              disabled={isSubmitting}
            >
              <SelectTrigger className="col-span-3" id="asset-status-trigger">
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
            <Label htmlFor="equipment-description" className="text-right col-span-1 pt-2">
              Description
            </Label>
            <Textarea
              id="equipment-description"
              name="equipment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 min-h-[80px]"
              placeholder="Enter a brief description of the equipment..."
              disabled={isSubmitting}
            />
          </div>



          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="equipment-image-upload" className="text-right col-span-1 pt-2">
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
                className="w-full flex items-center justify-center gap-2 border-dashed hover:border-primary hover:text-primary"
                aria-label="Upload equipment image"
                id="upload-image-button"
              >
                <UploadCloud className="h-4 w-4" />
                {imageFile ? 'Change image' : 'Upload an image'}
              </Button>
              {imagePreview && (
                <div className="mt-3 relative w-full h-40 border rounded-md overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="mt-2 flex flex-col items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                      id="remove-image-button"
                      aria-label="Remove uploaded image"
                    >
                      <X className="mr-1 h-4 w-4" /> Remove image
                    </Button>
                  </div>
                </div>
              )}
              {!imagePreview && (
                <div className="mt-3 flex items-center justify-center w-full h-40 border border-dashed rounded-md bg-gray-50 text-gray-400">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Allowed types: JPG, PNG, GIF, WEBP.</p>
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button type="submit" form="add-equipment-form" disabled={isSubmitting || !equipmentName || !assetStatusId}>
            {isSubmitting ? 'Adding...' : 'Add Equipment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
