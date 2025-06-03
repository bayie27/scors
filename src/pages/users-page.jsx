import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Search, Loader2, Building2 } from "lucide-react";
import { supabase } from '../supabase-client';
import { OrganizationDialog } from "@/components/organizations/organization-dialog";
import { UserDialog, DeleteUserDialog } from "@/components/users/user-dialog";

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  
  // User dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Track subscription to prevent memory leaks
  const subscriptionRef = useRef(null);
  
  // Memoize the fetchUsers function to prevent unnecessary re-renders
  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users data...');
      // Only show loading indicator on initial load, not on refreshes
      if (users.length === 0) {
        setLoading(true);
      }
      
      // Fetch users with their associated organizations
      const { data: _data, error } = await supabase
        .from("user")
        .select(`
          *,
          organization:org_id (
            org_id,
            org_code,
            org_name
          )
        `)
        .order('user_id', { ascending: true });
      
      if (error) throw error;
      
      console.log('Users data fetched:', _data?.length || 0, 'records');
      
      // Update users state with fresh data
      setUsers(_data || []);
      
      // Update filtered users based on current search query
      if (searchQuery.trim() === "") {
        setFilteredUsers(_data || []);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = (_data || []).filter(user => 
          user.whitelisted_email?.toLowerCase().includes(query) ||
          user.organization?.org_code?.toLowerCase().includes(query) ||
          user.organization?.org_name?.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
      }
    } catch (error) {
      console.error("Error fetching users:", error.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, users.length]);
  
  // Set up real-time subscription
  const setupSubscription = useCallback(async () => {
    try {
      // Clean up any existing subscription first
      if (subscriptionRef.current) {
        await subscriptionRef.current.unsubscribe();
        // Unsubscribed from previous channel
      }
      
      // Create new subscription to the user table with specific event handlers for each operation type
      const channel = supabase.channel('public:user', {
        config: {
          broadcast: { self: true },
          presence: { key: 'user-management' },
        },
      });
      
      channel
        .on('presence', { event: 'sync' }, () => {
          // Presence synced
        })
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'user' }, 
          (payload) => {
            // User added
            fetchUsers();
          }
        )
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'user' }, 
          (payload) => {
            // User updated
            fetchUsers();
          }
        )
        .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'user' }, 
          (payload) => {
            // User deleted
            fetchUsers();
          }
        );
      
      // Subscribe to the channel
      const status = await channel.subscribe(async (status) => {
        // Subscription status updated
        if (status === 'SUBSCRIBED') {
          // Force a refresh when subscription is established
          await fetchUsers();
        }
      });
      
      // Store the channel reference
      subscriptionRef.current = channel;
      // Subscription set up successfully
    } catch (error) {
      // Error setting up real-time subscription
      // Retry subscription after a delay
      setTimeout(() => setupSubscription(), 3000);
      throw error;
    }
  }, [fetchUsers]);

  // Set up subscription on component mount
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        await setupSubscription();
      } catch (error) {
        console.error('Failed to initialize subscription:', error);
      }
    };
    
    if (isMounted) {
      init();
    }
    
    // Clean up subscription when component unmounts
    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe().catch(console.error);
      }
    };
  }, [setupSubscription]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.whitelisted_email?.toLowerCase().includes(lowercaseQuery) ||
          user.organization?.org_code?.toLowerCase().includes(lowercaseQuery) ||
          user.organization?.org_name?.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // fetchUsers is already defined above using useCallback
  /*
    try {
      // Fetching users data
      // Only show loading indicator on initial load, not on refreshes
      if (users.length === 0) {
        setLoading(true);
      }
      
      // Fetch users with their associated organizations
      const { data, error } = await supabase
        .from("user")
        .select(`
          *,
          organization:org_id (
            org_id,
            org_code,
            org_name
          )
        `)
        .order('user_id', { ascending: true });
      
      if (error) throw error;
      
      // Users data fetched
      
      // Update users state with fresh data
      setUsers(data || []);
      
      // Update filtered users based on current search query
      if (searchQuery.trim() === "") {
        setFilteredUsers(data || []);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = (data || []).filter(user => 
          user.whitelisted_email?.toLowerCase().includes(query) ||
          user.organization?.org_code?.toLowerCase().includes(query) ||
          user.organization?.org_name?.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
      }
    } catch (error) {
      // Error fetching users
    } finally {
      setLoading(false);
    }
  };
  */

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddUser = () => {
    // Reset selected user first to ensure form is clean
    setSelectedUser(null);
    // Small delay to ensure state is updated before opening the dialog
    setTimeout(() => {
      setUserDialogOpen(true);
    }, 10);
  };

  const handleOpenOrgDialog = () => {
    setOrgDialogOpen(true);
  };

  const handleCloseOrgDialog = () => {
    setOrgDialogOpen(false);
    // No need to manually fetch users since we have the subscription
  };

  const handleEditUser = (user) => {
    // Make a copy of the user to avoid reference issues
    setSelectedUser({...user});
    // Small delay to ensure state is updated before opening the dialog
    setTimeout(() => {
      setUserDialogOpen(true);
    }, 10);
  };

  const handleUserDialogClose = () => {
    setUserDialogOpen(false);
    // Clear selected user after dialog closes with a small delay
    setTimeout(() => {
      setSelectedUser(null);
    }, 100);
  };

  const handleDeleteClick = (user) => {
    // Make a copy of the user to avoid reference issues
    setUserToDelete({...user});
    // Small delay to ensure state is updated before opening the dialog
    setTimeout(() => {
      setDeleteDialogOpen(true);
    }, 10);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    // Clear user to delete after dialog closes with a small delay
    setTimeout(() => {
      setUserToDelete(null);
    }, 100);
  };

  const performDeleteUser = async () => {
    if (!userToDelete?.user_id) return;
    
    try {
      setDeleteLoading(true);
      // Deleting user
      
      // Store user ID in case we need it after state is cleared
      const userId = userToDelete.user_id;
      const userEmail = userToDelete.whitelisted_email;
      
      const { error } = await supabase
        .from('user')
        .delete()
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      
      // User deleted successfully
      
      // Close dialog first, then clear state
      setDeleteDialogOpen(false);
      
      // Clear delete state after a short delay
      setTimeout(() => {
        setUserToDelete(null);
      }, 100);
      
      // Manually trigger a fetch to ensure UI is updated immediately
      // This helps in case the subscription has any delays
      setTimeout(() => {
        fetchUsers();
      }, 300);
      
    } catch (err) {
      // Error deleting user
      alert(`Failed to delete user: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUserSave = () => {
    // User saved, updating UI
    // Close the dialog first
    setUserDialogOpen(false);
    
    // Immediately trigger a data refresh to ensure UI updates
    fetchUsers();
    
    // Clear selected user after a delay
    setTimeout(() => {
      setSelectedUser(null);
    }, 100);
  };

  return (
    <div className="p-4 md:p-6 flex flex-col h-full">
      {/* Sticky header area */}
      <div className="bg-white z-10 sticky top-0 pb-4">
        <div className="flex justify-between items-center pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Users</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow p-4 border">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          {/* Search input - full width on mobile, fixed width on desktop */}
          <div className="relative flex items-center w-full sm:w-72">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              className="pl-8 pr-4 py-2 border-gray-300 rounded-md"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Action buttons - stack on mobile, inline on desktop */}
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
            <Button 
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              Add User +
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenOrgDialog}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
            >
              <Building2 className="mr-2 h-4 w-4" />
              List of Organizations
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* Users Tables/Cards */}
      <div className="mt-4 bg-white rounded-xl shadow border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
          </div>
        ) : (
          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="bg-gray-50 whitespace-nowrap">Org Acronym</TableHead>
                    <TableHead className="bg-gray-50 hidden md:table-cell">Organization Name</TableHead>
                    <TableHead className="bg-gray-50 whitespace-nowrap">Email</TableHead>
                    <TableHead className="w-24 text-center bg-gray-50 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="whitespace-nowrap">{user.organization?.org_code || "--"}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.organization?.org_name || "--"}</TableCell>
                        <TableCell className="whitespace-nowrap max-w-[150px] sm:max-w-none truncate">{user.whitelisted_email}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-row gap-2 items-center justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Mobile Card View */}
            <div className="sm:hidden p-2 space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users found.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.user_id} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Email</div>
                        <div className="font-medium break-all">{user.whitelisted_email}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Organization</div>
                        <div>
                          <span className="font-semibold">{user.organization?.org_code || "--"}</span>
                          {user.organization?.org_name && (
                            <span className="text-sm text-gray-500 ml-1">({user.organization.org_name})</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Organization Dialog */}
      <OrganizationDialog 
        open={orgDialogOpen} 
        onClose={handleCloseOrgDialog} 
      />
      
      {/* User Dialog for Add/Edit */}
      <UserDialog
        isOpen={userDialogOpen}
        onClose={handleUserDialogClose}
        user={selectedUser}
        onSave={handleUserSave}
      />
      
      {/* Delete User Confirmation Dialog */}
      <DeleteUserDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={performDeleteUser}
        isLoading={deleteLoading}
        userName={userToDelete?.whitelisted_email || ''}
      />
    </div>
  );
}
