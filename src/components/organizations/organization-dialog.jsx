import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import { supabase } from "../../supabase-client";

// Form for adding/editing an organization
const OrganizationForm = ({ organization, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    org_code: "",
    org_name: "",
    ...organization,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.org_code.trim() || !formData.org_name.trim()) {
      setError("Organization code and name are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (organization?.org_id) {
        // Update existing organization
        const { error } = await supabase
          .from("organization")
          .update({
            org_code: formData.org_code,
            org_name: formData.org_name,
          })
          .eq("org_id", organization.org_id);

        if (error) throw error;
      } else {
        // Create new organization
        const { error } = await supabase
          .from("organization")
          .insert([
            {
              org_code: formData.org_code,
              org_name: formData.org_name,
            },
          ]);

        if (error) throw error;
      }

      // Success - notify the parent component to refresh the list
      onSave();
    } catch (err) {
      // Error saving organization
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md z-50" style={{ zIndex: 60 }}>
        <DialogHeader>
          <DialogTitle>
            {organization?.org_id ? "Edit Organization" : "Add Organization"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="org_code"
              className="block text-sm font-medium text-gray-700"
            >
              Organization Acronym *
            </label>
            <Input
              id="org_code"
              name="org_code"
              value={formData.org_code}
              onChange={handleChange}
              placeholder="e.g., JPCS"
              required
              autoFocus
              className="focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="org_name"
              className="block text-sm font-medium text-gray-700"
            >
              Organization Name *
            </label>
            <Input
              id="org_name"
              name="org_name"
              value={formData.org_name}
              onChange={handleChange}
              placeholder="e.g., Junior Philippine Computer Society"
              required
              className="focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : organization?.org_id ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Confirmation Modal Component for deletion
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, confirmColor, isLoading }) => {
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        
        <DialogFooter className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            {cancelText || 'Cancel'}
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm}
            disabled={isLoading}
            className={`${
              confirmColor === 'red' 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } text-white`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText || 'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Organization Dialog component
export function OrganizationDialog({ open, onClose }) {
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState(null);
  
  // Fetch organizations
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("organization")
        .select("*")
        .order("org_name");
      
      if (error) throw error;
      
      setOrganizations(data || []);
      setFilteredOrganizations(data || []);
    } catch (err) {
      // Error fetching organizations
      setError("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOrganizations();
    }
  }, [open]);

  const handleAddClick = () => {
    setSelectedOrganization(null);
    setShowForm(true);
  };

  const handleEditClick = (org) => {
    setSelectedOrganization(org);
    setShowForm(true);
  };

  const handleDeleteClick = (org) => {
    setOrganizationToDelete(org);
    setDeleteConfirmOpen(true);
  };
  
  // Perform actual deletion after confirmation
  const performDelete = async () => {
    if (!organizationToDelete?.org_id) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("organization")
        .delete()
        .eq("org_id", organizationToDelete.org_id);
      
      if (error) throw error;
      
      // Close confirmation modal and refresh the list
      setDeleteConfirmOpen(false);
      setOrganizationToDelete(null);
      fetchOrganizations();
    } catch (err) {
      // Error deleting organization
      setError(`Failed to delete organization: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedOrganization(null);
  };

  // Handle organization search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredOrganizations(organizations);
    } else {
      setFilteredOrganizations(
        organizations.filter(
          (org) =>
            org.org_code.toLowerCase().includes(query.toLowerCase()) ||
            org.org_name.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setSelectedOrganization(null);
    // Refresh the list to show the newly added/edited organization
    fetchOrganizations();
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-20 bg-white p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">List of Organizations</DialogTitle>
          </DialogHeader>

          <div className="flex flex-row gap-3 justify-between items-center sticky top-[4.5rem] z-10 bg-white px-6 py-3 border-b">
            <div className="flex-1 max-w-xs">
              <Input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleAddClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Organization
            </Button>
          </div>

          {error && (
            <div className="mx-6 my-3 bg-red-50 text-red-600 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {loading && !showForm ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 font-medium">Loading organizations...</span>
            </div>
          ) : (
            <div className="mx-6 mb-6 bg-white rounded-xl shadow border overflow-hidden">
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                <Table className="w-full">
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="bg-gray-100 font-medium">Acronym</TableHead>
                      <TableHead className="bg-gray-100 font-medium">Name</TableHead>
                      <TableHead className="w-52 text-center bg-gray-100 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                          No organizations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrganizations.map((org) => (
                        <TableRow key={org.org_id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{org.org_code}</TableCell>
                          <TableCell className="text-gray-700">{org.org_name}</TableCell>
                          <TableCell className="flex gap-2 justify-center items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(org)}
                              className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(org)}
                              className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showForm && (
        <OrganizationForm
          organization={selectedOrganization}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={performDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the organization "${organizationToDelete?.org_name || ''}" (${organizationToDelete?.org_code || ''})? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
        isLoading={loading && deleteConfirmOpen}
      />
    </>
  );
}
