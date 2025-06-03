import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { UsersPage } from "./users-page";
import { VenuesPage } from "./venues-page";
import { PendingApprovalsPage } from "./PendingApprovalsPage";
import { Search, Plus } from 'lucide-react';
import { EquipmentPage } from "./equipment-page";
import HelpPage from "./HelpPage";
import { Users, Building2, Boxes, ClipboardCheck, LogOut, ChevronLeft, ChevronRight, Calendar, HelpCircle, Menu } from "lucide-react";
import scorsLogo from "@/assets/scors-logo.png";
import { format } from 'date-fns';
import { useRoleAccess } from "@/lib/useRoleAccess.jsx";

export function CalendarPage({ user, onSignOut, view = 'calendar' }) {
  const { isAdmin, canManageUsers } = useRoleAccess();
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Get the view from the URL path if not provided as a prop
  const currentView = view || location.pathname.split('/')[1] || 'calendar';

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    // The search is now handled by the EventCalendar component
  }, []);

  const handleReserveClick = () => {
    setIsReserveModalOpen(true);
    setSelectedSlot({
      activity_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: format(new Date(), 'HH:mm'),
      end_time: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm') // 1 hour later
    });
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Reset search term when changing views
  useEffect(() => {
    setSearchTerm('');
  }, [location.pathname]);
  
  // Ensure user is redirected from restricted pages on component mount
  useEffect(() => {
    if ((currentView === 'users' || currentView === 'approvals') && !canManageUsers) {
      navigate('/');
    }
  }, [canManageUsers, currentView, navigate]);
  
  // Reset reserve modal state when component unmounts or when view changes
  useEffect(() => {
    // Cleanup function to reset modal state
    const resetModalState = () => {
      if (isReserveModalOpen) {
        setIsReserveModalOpen(false);
      }
      if (selectedSlot) {
        setSelectedSlot(null);
      }
    };
    
    // Reset modal state when view changes to something other than calendar
    if (activeView !== 'calendar') {
      resetModalState();
    }
    
    // Cleanup on unmount
    return () => {
      resetModalState();
    };
  }, [activeView, isReserveModalOpen, selectedSlot]);
  
  // Function to handle event creation from the calendar's quick add button
  const handleQuickAddEvent = () => {
    const title = prompt('Quick Add Event (Today)');
    if (title) {
      const newEvent = {
        id: Date.now(),
        title,
        start: new Date(),
        end: new Date(new Date().setHours(new Date().getHours() + 1)),
        resource: 'Quick Add'
      };
      // Event creation would be implemented here
    }
  };

  // Render the appropriate component based on the current view
  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return (
          <EventCalendar 
            searchTerm={searchTerm} 
            onSearchChange={handleSearch}
            selectedSlot={selectedSlot}
            onSlotSelected={() => setIsReserveModalOpen(false)}
            onQuickAddEvent={handleQuickAddEvent}
            onReserve={handleReserveClick}
          />
        );
      case 'users':
        return <UsersPage />;
      case 'venues':
        return <VenuesPage />;
      case 'equipment':
        return <EquipmentPage />;
      case 'help':
        return <HelpPage />;
      case 'approvals':
        return <PendingApprovalsPage />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
              <p className="text-gray-500">The requested page could not be found.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10 h-[60px] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img 
            src={scorsLogo} 
            alt="SCORS" 
            className="h-10 w-auto"
          />
          {user?.organization ? (
            <div className="hidden md:flex items-center space-x-2 border-l border-gray-200 pl-4">
              <span className="text-base font-medium text-gray-800">
                {user.organization.org_code}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-base text-gray-700">
                {user.organization.org_name}
              </span>
              {isAdmin && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-base font-medium text-blue-600">
                    Admin
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-sm text-red-500">No organization information</span>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          user={user} 
          onSignOut={onSignOut} 
          onReserve={handleReserveClick}
          collapsed={collapsed}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden pt-[60px] h-[calc(100vh-60px)]">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>


    </div>
  );
}
