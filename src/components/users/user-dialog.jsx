import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "../../supabase-client";

// Form for adding/editing a user
export function UserDialog({ isOpen, onClose, user = null, onSave }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOrgs, setFetchingOrgs] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    whitelisted_email: "",
    org_id: "",
  });
  
  // Update form data when user changes or dialog opens
  useEffect(() => {
    if (user) {
      setFormData({
        whitelisted_email: user.whitelisted_email || "",
        org_id: user.org_id || ""
      });
    } else {
      // Reset form when adding a new user
      setFormData({
        whitelisted_email: "",
        org_id: ""
      });
    }
  }, [user, isOpen]);

  // Selected organization for display
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Fetch organizations on mount
  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

  // Set selected org when form data changes (for edit mode)
  useEffect(() => {
    if (formData.org_id && organizations.length > 0) {
      const org = organizations.find(org => org.org_id === formData.org_id);
      if (org) {
        setSelectedOrg(org);
      }
    }
  }, [formData.org_id, organizations]);

  const fetchOrganizations = async () => {
    try {
      setFetchingOrgs(true);
      
      const { data, error } = await supabase
        .from("organization")
        .select("*")
        .order("org_name");
      
      if (error) throw error;
      
      setOrganizations(data || []);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError("Failed to load organizations");
    } finally {
      setFetchingOrgs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOrgChange = (e) => {
    const orgId = e.target.value;
    setFormData(prev => ({
      ...prev,
      org_id: orgId
    }));

    if (orgId) {
      const org = organizations.find(org => org.org_id === orgId);
      setSelectedOrg(org);
    } else {
      setSelectedOrg(null);
    }
  };

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(formData.whitelisted_email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Validate organization
    if (!formData.org_id) {
      setError("Please select an organization");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Store values locally to avoid state closure issues
      const email = formData.whitelisted_email;
      const orgId = formData.org_id;
      const userId = user?.user_id;

      if (userId) {
        // Update existing user
        const { error, data } = await supabase
          .from("user")
          .update({
            whitelisted_email: email,
            org_id: orgId
          })
          .eq("user_id", userId)
          .select();

        if (error) throw error;
        console.log('User updated successfully:', data);
      } else {
        // Create new user
        const { error, data } = await supabase
          .from("user")
          .insert([{
            whitelisted_email: email,
            org_id: orgId
          }])
          .select();

        if (error) throw error;
        console.log('User created successfully:', data);
      }

      // Notify parent component first (will handle closing)
      onSave();
      setLoading(false);
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-md mx-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {user?.user_id ? "Edit User" : "Add New User"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Organization Selection */}
          <div className="space-y-2">
            <label
              htmlFor="org_id"
              className="block text-sm font-medium text-gray-700"
            >
              Organization *
            </label>
            
            <select
              id="org_id"
              name="org_id"
              value={formData.org_id}
              onChange={handleOrgChange}
              disabled={fetchingOrgs}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              required
            >
              <option value="">Select an organization</option>
              {organizations.map((org) => (
                <option key={org.org_id} value={org.org_id}>
                  {org.org_code} - {org.org_name}
                </option>
              ))}
            </select>
            
            {fetchingOrgs && (
              <div className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
                <Loader2 className="animate-spin h-3 w-3 mr-1" />
                Loading organizations...
              </div>
            )}
          </div>



          {/* Email Input */}
          <div className="space-y-2">
            <label
              htmlFor="whitelisted_email"
              className="block text-sm font-medium text-gray-700"
            >
              Organization Email *
            </label>
            <Input
              id="whitelisted_email"
              name="whitelisted_email"
              type="email"
              value={formData.whitelisted_email}
              onChange={handleChange}
              placeholder="org@dlsl.edu.ph"
              required
              className="focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : user?.user_id ? (
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
}

// Confirmation Modal Component for deletion
export function DeleteUserDialog({ isOpen, onClose, onConfirm, isLoading, userName }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-md mx-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Confirm Deletion</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the user with email "{userName}"? This action cannot be undone.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white w-full sm:w-auto order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
