import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Boxes,
  ClipboardCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Menu,
  X,
  HelpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRoleAccess } from "@/lib/useRoleAccess.jsx";
import { NavLink, useLocation } from "react-router-dom";


/**
 * Sidebar component for navigation and user actions
 * @param {Object} user - The current user object
 * @param {Function} onSignOut - Callback for sign out action
 * @param {Function} onReserve - Callback for reserve action
 * @param {string} className - Additional CSS classes
 * @param {boolean} collapsed - Whether the sidebar is collapsed
 */
export function Sidebar({ 
  user = {}, 
  onSignOut = () => {}, 
  onReserve = () => {}, 
  className = '', 
  collapsed = false
}) { 
  const { isAdmin, canManageUsers } = useRoleAccess();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  
  // Check if screen is mobile-sized
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Close mobile menu when changing views
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await onSignOut();
    } catch (error) {
      // Handle sign out error
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    try {
      return name
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0] || '')
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } catch (error) {
      // Error generating initials
      return 'U';
    }
  };

  // Define all possible menu items
  const allMenuItems = [
    {
      title: "Calendar",
      icon: <Calendar size={20} />,
      path: "/",
      view: "calendar",
      requiredPermission: true, // Always visible
    },
    {
      title: "Users",
      icon: <Users size={20} />,
      path: "/users",
      view: "users",
      requiredPermission: canManageUsers(), // Only visible for admin users
    },
    {
      title: "Venues",
      icon: <Building2 size={20} />,
      path: "/venues",
      view: "venues",
      requiredPermission: true, // Always visible
    },
    {
      title: "Equipment",
      icon: <Boxes size={20} />,
      path: "/equipment",
      view: "equipment",
      requiredPermission: true, // Always visible
    },
    {
      title: "Pending Approvals",
      icon: <ClipboardCheck size={20} />,
      path: "/approvals",
      view: "approvals",
      requiredPermission: canManageUsers(), // Only visible for admin users
    },
    {
      title: "Help",
      icon: <HelpCircle size={20} />,
      path: "/help",
      view: "help",
      requiredPermission: true, // Always visible
    },
  ];
  
  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => item.requiredPermission);

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // Handle menu item click (close mobile menu after clicking)
  const handleMenuItemClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button 
          variant="outline" 
          size="icon"
          className="h-10 w-10 rounded-md bg-white shadow-md border-gray-200"
          onClick={toggleMobileMenu}
        >
          <Menu size={20} />
        </Button>
      </div>
      
      {/* Backdrop overlay for mobile */}
      {isMobileMenuOpen && isMobile && (
        <div 
          className="fixed inset-0 top-15 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div
        className={cn(
          "flex flex-col bg-white border-r shadow-sm transition-all duration-300 ease-in-out",
          // Different positioning for mobile vs desktop
          isMobile 
            ? "fixed z-40 top-15 bottom-0" // Extend to the bottom of the screen
            : "relative h-[calc(100vh-60px)] mt-[60px]",
          // Control visibility and width
          isMobile 
            ? isMobileMenuOpen ? "left-0 w-[250px]" : "-left-[280px] w-[270px]" 
            : collapsed ? "w-16" : "w-64",
          className
        )}
      >
      {/* Mobile Organization Info */}
      {isMobile && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="font-medium text-base">
              {user?.organization?.org_code || ""} 
              <span className="inline-block mx-1">•</span> 
              {isAdmin ? "Admin" : "Org"}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto safe-bottom flex flex-col">
        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.title}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    cn(
                      "flex w-full items-center rounded-md",
                      isActive 
                        ? "bg-gray-100 text-blue-600" 
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      collapsed && !isMobile ? "px-0 py-2 justify-center" : "px-3 py-2 justify-start"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {collapsed && !isMobile ? (
                        <span className={isActive ? "text-blue-600" : ""}>
                          {item.icon}
                        </span>
                      ) : (
                        <>
                          <span className={cn("mr-3", isActive ? "text-blue-600" : "")}>
                            {item.icon}
                          </span>
                          <span>{item.title}</span>
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Spacer to push profile to bottom */}
        {isMobile && <div className="flex-grow"></div>}
        
        {/* User profile and logout - at the bottom of scrollable area on mobile */}
        {isMobile && (
          <div className="border-t p-4 mt-auto pb-6">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar_url} alt={user?.email || 'User'} />
                  <AvatarFallback className="bg-gray-200 text-gray-700">
                    {user?.email ? getInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.organization?.org_name}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className={`h-4 w-4 ${isSigningOut ? 'animate-spin' : ''}`} />
                <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User profile and logout - fixed at bottom for desktop */}
      {!isMobile && (
        <div className="border-t p-4 mt-auto">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar_url} alt={user?.email || 'User'} />
                <AvatarFallback className="bg-gray-200 text-gray-700">
                  {user?.email ? getInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.organization?.org_name}
                  </p>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className={`h-4 w-4 ${isSigningOut ? 'animate-spin' : ''}`} />
              {!collapsed && <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>}
            </Button>
          </div>
        </div>
      )}
    </div>

      {/* Floating Action Button for Mobile - Only on Calendar View */}
      {isMobile && location.pathname === '/' && (
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-50 flex items-center justify-center"
          onClick={onReserve}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </Button>
      )}
    </>
  );
}
