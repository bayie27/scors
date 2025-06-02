import { useState, useEffect, useRef } from 'react';
import { Plus, Search as SearchIcon, Filter, X, Loader2, Upload, Image as ImageIcon, SquareStack } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/supabase-client';
import { equipmentService } from '@/services/equipment-service';
import { toast } from 'react-hot-toast';

function EquipmentIcon({ name, ...props }) {
  switch ((name || '').toLowerCase()) {
    case 'projector': return <SquareStack {...props} />;
    case 'audio system': return <SquareStack {...props} />;
    case 'wifi': return <SquareStack {...props} />;
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
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    equipment_name: '',
    quantity: '',
    location: '',
    description: '',
    asset_status_id: 1 // Default to available
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    let hasError = false;
    const newImages = [];
    const newPreviews = [];
    files.forEach(file => {
      if (!file.type.match('image.*')) {
        setFormErrors(prev => ({ ...prev, image: 'Please select only image files (JPEG, PNG, etc.)' }));
        hasError = true;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, image: 'Each image size should be less than 5MB' }));
        hasError = true;
        return;
      }
      newImages.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({ file: file, preview: reader.result });
        if (newPreviews.length === newImages.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (!hasError) {
      setFormErrors(prev => ({ ...prev, image: undefined }));
      setSelectedImages(prev => [...prev, ...newImages]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.equipment_name?.trim()) errors.equipment_name = 'Equipment name is required';
    if (!formData.location?.trim()) errors.location = 'Location is required';
    if (formData.quantity && (isNaN(formData.quantity) || Number(formData.quantity) <= 0)) {
      errors.quantity = 'Quantity must be a positive number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const equipmentData = {
        equipment_name: formData.equipment_name,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        location: formData.location,
        description: formData.description || null,
        asset_status_id: formData.asset_status_id
      };
      let tempImageUrls = [];
      if (imagePreviews.length > 0) {
        tempImageUrls = imagePreviews.map(img => img.preview);
      }
      const tempId = Date.now();
      const optimisticEquipment = {
        ...equipmentData,
        equipment_id: tempId,
        images: tempImageUrls
      };
      setEquipment(prev => [optimisticEquipment, ...prev]);
      setIsAddEquipmentModalOpen(false);
      setFormData({ equipment_name: '', quantity: '', location: '', description: '', asset_status_id: 1 });
      clearAllImages();
      const created = await equipmentService.createEquipment(equipmentData);
      setEquipment(prev => prev.map(eq => eq.equipment_id === tempId ? created : eq));
      toast.success('Equipment added successfully');
    } catch (error) {
      toast.error('Failed to add equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    equipmentService.getEquipment()
      .then(setEquipment)
      .catch(() => toast.error('Failed to fetch equipment'))
      .finally(() => setIsLoading(false));
    if (subscriptionRef.current) {
      subscriptionRef.current();
    }
    subscriptionRef.current = equipmentService.subscribeToEquipment(() => {
      equipmentService.getEquipment().then(setEquipment);
    });
    return () => {
      if (subscriptionRef.current) subscriptionRef.current();
    };
  }, []);

  const filteredEquipment = equipment.filter(eq =>
    eq.equipment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (eq.location && eq.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Equipment Management</h1>
        <div className="flex gap-2">
          <Dialog open={isAddEquipmentModalOpen} onOpenChange={setIsAddEquipmentModalOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" className="gap-2">
                <Plus className="h-5 w-5" /> Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-full">
              <DialogTitle>Add Equipment</DialogTitle>
              <DialogDescription>Fill in the details to add new equipment.</DialogDescription>
              <form className="space-y-4" onSubmit={handleAddEquipment}>
                <Input name="equipment_name" label="Equipment Name" placeholder="e.g. Projector" value={formData.equipment_name} onChange={handleFormChange} required />
                <Input name="quantity" label="Quantity" placeholder="e.g. 10" value={formData.quantity} onChange={handleFormChange} />
                <Input name="location" label="Location" placeholder="e.g. Storage Room" value={formData.location} onChange={handleFormChange} required />
                <Input name="description" label="Description" placeholder="Optional" value={formData.description} onChange={handleFormChange} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image(s)</label>
                  <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  {formErrors.image && <div className="text-red-500 text-xs mt-1">{formErrors.image}</div>}
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {imagePreviews.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16">
                          <img src={img.preview} alt="preview" className="w-full h-full object-cover rounded" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-white rounded-full p-1 shadow">
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={clearAllImages} className="ml-2 text-xs text-blue-600 hover:underline">Clear All</button>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-2">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Add Equipment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-full max-w-xs">
          <Input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pr-10"
            ref={searchInputRef}
          />
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">No equipment found.</div>
        ) : (
          filteredEquipment.map(eq => (
            <Card key={eq.equipment_id} className="relative group cursor-pointer transition hover:shadow-lg" onClick={() => setSelectedEquipment(eq)}>
              <CardHeader className="flex flex-row items-center gap-3">
                <EquipmentIcon name={eq.equipment_name} className="h-6 w-6 text-blue-600" />
                <CardTitle className="truncate">{eq.equipment_name}</CardTitle>
                <Badge variant="outline" className="ml-auto">{eq.quantity || 0} pcs</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-gray-600 text-sm line-clamp-2">{eq.description || 'No description'}</div>
                <div className="text-xs text-gray-400 mt-2">Location: {eq.location || '-'}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Equipment Details Dialog */}
      {selectedEquipment && (
        <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
          <DialogContent className="max-w-lg w-full">
            <DialogTitle>Equipment Details</DialogTitle>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EquipmentIcon name={selectedEquipment.equipment_name} className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-semibold text-lg">{selectedEquipment.equipment_name}</div>
                  <div className="text-xs text-gray-400">ID: {selectedEquipment.equipment_id}</div>
                </div>
              </div>
              <div className="text-gray-600 text-sm">{selectedEquipment.description || 'No description'}</div>
              <div className="flex gap-2">
                <Badge variant="outline">{selectedEquipment.quantity || 0} pcs</Badge>
                <Badge variant="secondary">{selectedEquipment.location || '-'}</Badge>
              </div>
              {selectedEquipment.images && selectedEquipment.images.length > 0 ? (
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedEquipment.images.map((img, idx) => (
                    <img key={idx} src={img} alt="Equipment" className="w-20 h-20 object-cover rounded" />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400">No images</div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-t bg-gray-50 mt-6">
              <div className="text-sm text-gray-500">Last updated: {new Date(selectedEquipment.updated_at || new Date()).toLocaleDateString()}</div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex justify-between sm:justify-end gap-3 w-full">
                  <Button variant="ghost" className="h-10 px-4 text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={() => setSelectedEquipment(null)}>
                    <X className="h-4 w-4 mr-2" /> Close
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" className="h-10 px-4 flex items-center gap-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => toast.success('Edit functionality will be implemented soon!')}>
                      Edit Equipment
                    </Button>
                    <div className="border-l border-gray-200 h-6 self-center hidden sm:block"></div>
                    <Button variant="outline" className="h-10 px-4 flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300" onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete "${selectedEquipment.equipment_name}"? This action cannot be undone.`)) {
                        try {
                          toast.success('Delete functionality will be implemented soon!');
                          setSelectedEquipment(null);
                        } catch (error) {
                          toast.error('Failed to delete equipment');
                        }
                      }
                    }}>
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

export default EquipmentPage;
