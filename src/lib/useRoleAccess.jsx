  import { useState, useEffect, createContext, useContext } from "react";

  // Create a context for role-based access
  const RoleAccessContext = createContext();

  // Role constants
  export const ROLES = {
    ADMIN: 'admin', // CSAO (org_id = 1)
    ORGANIZATION: 'organization' // All other organizations
  };

  // Provider component for role-based access
  export function RoleAccessProvider({ children, user }) {
    const [userRole, setUserRole] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Function to determine user role based on organization ID
    const determineUserRole = (userData) => {
      if (!userData) {
        setUserRole(null);
        setIsAdmin(false);
        return;
      }

      // Check if the user belongs to CSAO (org_id = 1)
      // org_id can be directly on the user object or inside organization
      const orgId = userData.org_id || (userData.organization?.org_id);
      const isCSAO = orgId === 1;
      
      
      setUserRole(isCSAO ? ROLES.ADMIN : ROLES.ORGANIZATION);
      setIsAdmin(isCSAO);
    };

    // Helper function to check permissions
    const hasPermission = (requiredRole) => {
      if (!userRole) return false;
      
      // Admin has access to everything
      if (userRole === ROLES.ADMIN) return true;
      
      // For organization users, only allow if the required role matches
      return userRole === requiredRole;
    };

    // Initialize with user data when component mounts
    useEffect(() => {
      if (user) {
        determineUserRole(user);
      }
    }, [user]);

    // Value to be provided by the context
    const value = {
      userRole,
      isAdmin,
      isLoading,
      setUser: (userData) => {
        determineUserRole(userData);
      },
      hasPermission,
      // Helper functions for common permission checks
      canManageUsers: () => userRole === ROLES.ADMIN,
      canManageVenues: () => true, // Both roles can access venues
      canManageEquipment: () => true, // Both roles can access equipment
      canViewCalendar: () => true, // Both roles can access calendar
      canApproveReservations: () => userRole === ROLES.ADMIN, // Only admin roles can approve reservations
    };

    return (
      <RoleAccessContext.Provider value={value}>
        {children}
      </RoleAccessContext.Provider>
    );
  }

  // Hook for consuming the role-based access context
  export function useRoleAccess() {
    const context = useContext(RoleAccessContext);
    if (!context) {
      throw new Error("useRoleAccess must be used within a RoleAccessProvider");
    }
    return context;
  }
